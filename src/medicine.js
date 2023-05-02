const express = require("express");
const pool = require("../database");
const {
  authPatientInfo,
  authDoctors,
  authPatientDoctors,
  authPatients,
} = require("../middleware/auth");

const router = express.Router();

router.get("/search", async (req, res) => {
  if (!req.query.text) {
    return res.status(400).json({ msg: "Nothing to search" });
  }

  try {
    const result = await pool.query(
      `
      SELECT * FROM medicine 
      WHERE name like CONCAT('%', ? ,'%') 
      OR drug_use like CONCAT('%', ? ,'%') 
      LIMIT 50; 
      `,
      [req.query.text, req.query.text]
    );
    if (result[0].length === 0)
      return res.status(400).json({ msg: "Nothing found" });

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/patient/search", authDoctors, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT m.* FROM medicine AS m
      LEFT JOIN patient_medicine AS pm ON m.id = pm.medicine_id 
      WHERE pm.patient_id IS NULL
      AND (
        m.name like CONCAT('%', ? ,'%') 
        OR m.drug_use like CONCAT('%', ? ,'%')
      ) 
      LIMIT 50; 
      `,
      [req.query.text, req.query.text]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/:id", async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  try {
    const result = await pool.query(
      `
      SELECT * FROM medicine WHERE id =? LIMIT 1
      `,
      [req.params.id]
    );
    if (result[0].length === 0)
      return res.status(400).json({ msg: "Nothing found" });

    res.json(result[0][0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/patient/info/", authDoctors, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT m.*,pm.id AS patient_medicine_id FROM medicine AS m
      INNER JOIN patient_medicine AS pm 
      ON m.id = pm.medicine_id 
      WHERE pm.patient_id = ?
      `,
      [req.query.patientId]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/patient/disease/info", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT m.*,pm.id AS patient_medicine_id FROM medicine AS m
      INNER JOIN patient_medicine AS pm 
      ON m.id = pm.medicine_id 
      INNER JOIN patient_disease_medicine AS pdm
      ON pm.id = pdm.patient_medicine_id
      WHERE pm.patient_id = ? AND pdm.patient_disease_id = ?
      `,
      [
        req.query.patientId != "null" ? req.query.patientId : req.token.id,
        req.query.patientDiseaseId,
      ]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/patient/mymedicine", authPatients, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT m.*,
        (
          SELECT json_arrayagg(
            json_merge(
              json_object('id',id),
              json_object('time',DATE_FORMAT(time,"%H:%i:%s")),
              json_object('days',days),
              json_object('pill_number',pill_number)
            )
          ) FROM potion AS p WHERE p.medicine_id = pm.id 
          ) AS potions
      FROM medicine AS m
      INNER JOIN patient_medicine AS pm 
      ON m.id = pm.medicine_id 
      WHERE pm.patient_id = ?
      `,
      [req.token.id]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/patient/info/search", authPatients, async (req, res) => {
  // if (!req.query.text) {
  //   return res.status(400).json({ msg: "Nothing to search" });
  // }
  try {
    const result = await pool.query(
      `
      SELECT m.*,
        (
          SELECT json_arrayagg(
            json_merge(
              json_object('id',id),
              json_object('time',DATE_FORMAT(time,"%H:%i:%s")),
              json_object('days',days),
              json_object('pill_number',pill_number)
            )
          ) FROM potion AS p WHERE p.medicine_id = pm.id 
          ) AS potions
      FROM medicine AS m
      INNER JOIN patient_medicine AS pm 
      ON m.id = pm.medicine_id 
      WHERE pm.patient_id = ?
      AND (
        m.name LIKE CONCAT('%', ? ,'%') 
        OR m.drug_use LIKE CONCAT('%', ? ,'%')
      ) 
      `,
      [req.token.id, req.query.text, req.query.text]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.post("/addNewMedicine", authDoctors, async (req, res) => {
  if (
    !req.body.medicineId ||
    !req.body.patientId ||
    !req.body.patientDiseaseId
  ) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await connection.query(
      `
      INSERT INTO patient_medicine(patient_id,medicine_id) 
      VALUES (? ,? )
    `,
      [req.body.patientId, req.body.medicineId]
    );

    await connection.query(
      `
      INSERT INTO patient_disease_medicine(patient_medicine_id,patient_disease_id)
      VALUES ( ? , ? )
    `,
      [result[0].insertId, req.body.patientDiseaseId]
    );

    await connection.query(
      `
      INSERT INTO patient_medicine_history(id,patient_id,medicine_id) 
      VALUES ( ?, ? ,? )
    `,
      [result[0].insertId, req.body.patientId, req.body.medicineId]
    );
    await connection.commit();
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.delete("/removeMedicine", authDoctors, async (req, res) => {
  if (!req.body.medicineId || !req.body.patientId) {
    return res.status(400).json({ msg: "There is no medicine with this ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM patient_medicine WHERE medicine_id=? AND patient_id = ?",
      [req.body.medicineId, req.body.patientId]
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

module.exports = router;
