const express = require("express");
const pool = require("../database");
const moment = require("moment-timezone");

const { authPatients } = require("../middleware/auth");
const router = express.Router();

router.get("/month", async (req, res) => {
  if (!req.query.medicineId || !req.query.patientId || !req.query.date) {
    return res.status(400).json({ msg: "Missing Data" });
  }
  let patientId;

  if (req.query.patientId != "null") {
    patientId = req.query.patientId;
  } else {
    patientId = req.token.id;
  }

  try {
    const result = await pool.query(
      `
      SELECT potion.*, ppl.date, ppl.time AS take_time FROM potion AS potion
      INNER JOIN patient_potion_log AS ppl ON potion.id = ppl.potion_id
      WHERE potion.medicine_id = ? AND potion.patient_id = ? AND ppl.date BETWEEN ? AND ?
    `,
      [
        req.query.medicineId,
        patientId,
        moment(req.query.date).startOf("month").format("YYYY-MM-DD"),
        moment(req.query.date).endOf("month").format("YYYY-MM-DD"),
      ]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.post("/takePotion", authPatients, async (req, res) => {
  if (!req.body.potionId) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await connection.query(
      `
        INSERT INTO patient_potion_log(patient_id,potion_id,date,time)
        VALUES(?,?,str_to_date(?,'%d/%m/%Y'),?)
    `,
      [
        req.token.id,
        req.body.potionId,
        moment().utcOffset(3).format("DD/MM/YYYY"),
        moment().utcOffset(3).format("hh:mm:ss"),
      ]
    );
    await connection.query(
      `
        INSERT INTO patient_potion_log_history(id,patient_id,potion_id,date,time)
        VALUES(?,?,?,str_to_date(?,'%d/%m/%Y'),?)
    `,
      [
        result[0].insertId,
        req.token.id,
        req.body.potionId,
        moment().utcOffset(3).format("DD/MM/YYYY"),
        moment().utcOffset(3).format("hh:mm:ss"),
      ]
    );

    connection.commit();
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

module.exports = router;
