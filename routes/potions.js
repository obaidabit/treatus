const express = require("express");
const pool = require("../database");
const moment = require("moment-timezone");

const {
  schedulePotionNotification,
  deleteNotification,
  updatePotionNotification,
} = require("./cron");

const {
  authDoctors,
  authPatientDoctors,
  authPatients,
} = require("../middleware/auth");
const router = express.Router();

router.get("/info", async (req, res) => {
  if (!req.query.potionId) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  try {
    const result = await pool.query("SELECT * FROM potion WHERE id=? LIMIT 1", [
      req.query.potionId,
    ]);

    res.json(result[0][0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});
//STEP 1.1: brings potion information for the specific patient and
//          chicking two cases
//          If the potion day is yes or day no I'm checking it is taken today or yesterday
//          If the potion is daily or custom I'am chicking the potion taken the same day
router.get("/todayPotions", authPatients, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT potion.*,m.name FROM potion AS potion
      INNER JOIN patient_medicine AS pm 
      ON potion.medicine_id = pm.id 
      INNER JOIN medicine AS m 
      ON pm.medicine_id = m.id 
      WHERE potion.patient_id = ?
      AND ((
        potion.days = "every other day" 
        AND NOT EXISTS(
          SELECT ppl.* FROM patient_potion_log AS ppl 
          WHERE (
            ppl.date = str_to_date(?,'%d/%m/%Y')
            OR ppl.date = str_to_date(?,'%d/%m/%Y')
          )
          AND ppl.potion_id = potion.id
        )
      ) OR (
			  potion.days <> "every other day"
        AND NOT EXISTS (
          SELECT ppl.* FROM patient_potion_log AS ppl 
          WHERE ppl.date = str_to_date(?,'%d/%m/%Y')
          AND ppl.potion_id = potion.id
			  )
      ))
    `,
      [
        req.token.id,
        moment().utcOffset(3).format("DD/MM/YYYY"),
        moment().utcOffset(3).subtract(1, "day").format("DD/MM/YYYY"),
        moment().utcOffset(3).format("DD/MM/YYYY"),
      ]
    );

    if (result[0].length === 0) return res.status(400).json([]);

    const todayPotions = result[0].filter((potion) => {
      if (
        potion.days.toLowerCase().includes("every day") ||
        potion.days
          .toLowerCase()
          .includes(moment().utcOffset(3).format("dddd").toLowerCase()) ||
        potion.days.toLowerCase().includes("every other day")
      ) {
        return true;
      }

      return false;
    });

    res.json(todayPotions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/medicine", authPatientDoctors, async (req, res) => {
  if (!req.query.medicineId) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  try {
    const result = await pool.query(
      `
      SELECT potion.* FROM potion AS potion
      INNER JOIN patient_medicine AS pm
      ON potion.medicine_id = pm.id
      WHERE potion.patient_id = ? AND pm.medicine_id = ?
    `,
      [req.query.patientId, req.query.medicineId]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.post("/addNewPotion", authDoctors, async (req, res) => {
  if (
    !req.body.patientMedicineId ||
    !req.body.patientId ||
    !req.body.time ||
    !req.body.days ||
    !req.body.pillNumber
  ) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await connection.query(
      `
        INSERT INTO potion(medicine_id,time,patient_id,days,pill_number)
        VALUES (?,?,?,?,?)
      `,
      [
        req.body.patientMedicineId,
        req.body.time,
        req.body.patientId,
        req.body.days,
        req.body.pillNumber,
      ]
    );

    await connection.query(
      `
        INSERT INTO potion_history(id,medicine_id,time,patient_id,days,pill_number)
        VALUES (?,?,?,?,?,?)
      `,
      [
        result[0].insertId,
        req.body.patientMedicineId,
        req.body.time,
        req.body.patientId,
        req.body.days,
        req.body.pillNumber,
      ]
    );
    //STEP 2.1: bring medicine information for the specific patient
    //          and checking if the query gives information
    //          and take the first result
    //          and preparing to send the notification for this potion
    const medicineData = await connection.query(
      `
      SELECT m.* FROM medicine AS m
      INNER JOIN patient_medicine AS pm ON pm.medicine_id = m.id
      WHERE pm.id = ?
    `,
      [req.body.patientMedicineId]
    );
    await connection.commit();

    let medicineName;

    if (medicineData[0].length > 0) {
      medicineName = medicineData[0][0].name;
    } else {
      medicineName = "";
    }

    schedulePotionNotification(
      {
        id: result[0].insertId,
        time: req.body.time,
        name: medicineName,
        days: req.body.days,
      },
      req.body.patientId
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.post("/updatePotion", authDoctors, async (req, res) => {
  if (
    !req.body.time ||
    !req.body.days ||
    !req.body.pillNumber ||
    !req.body.potionId
  ) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await connection.query(
      `
        UPDATE potion SET time=?,days=?,pill_number=? WHERE id=?
      `,
      [req.body.time, req.body.days, req.body.pillNumber, req.body.potionId]
    );

    await connection.query(
      `
        UPDATE potion_history SET time=?,days=?,pill_number=? WHERE id=?
      `,
      [req.body.time, req.body.days, req.body.pillNumber, req.body.potionId]
    );

    const potionData = await connection.query(
      `
      SELECT * FROM potion AS potion
      INNER JOIN patient_medicine AS pm ON pm.id = potion.medicine_id
      INNER JOIN medicine AS m ON m.id = pm.medicine_id
      WHERE potion.id = ?
    `,
      [req.body.potionId]
    );

    await connection.commit();
    //STEP 2.1: bring potin information for the specific patient
    //          and checking if the query gives information
    //          and take the first result
    //          and update the notification for this potion

    let potionName;
    if (potionData[0].length > 0) {
      potionName = potionData[0][0].name;
    } else {
      potionName = "";
    }

    updatePotionNotification(
      parseInt(req.body.potionId),
      {
        id: req.body.potionId,
        time: potionData[0][0].time,
        name: potionName,
        days: potionData[0][0].days,
      },
      potionData[0][0].patient_id
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.delete("/deletePotion", authDoctors, async (req, res) => {
  if (!req.body.potionId) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM patient_potion_log WHERE potion_id = ?;",
      [req.body.potionId]
    );

    const dResult = await connection.query(
      `
        DELETE FROM potion WHERE id = ?
      `,
      [req.body.potionId]
    );

    await connection.commit();

    deleteNotification(parseInt(req.body.potionId));
    res.json(dResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

module.exports = router;
