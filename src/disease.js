const express = require("express");
const pool = require("../database");
const {
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
      SELECT id,name,JSON_EXTRACT(symptoms,'$') AS symptoms FROM disease 
      WHERE name like CONCAT('%', ? ,'%') 
      OR symptoms like CONCAT('%', ? ,'%') 
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

router.get("/new/search", authDoctors, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT d.id,d.name,JSON_EXTRACT(d.symptoms,'$') AS symptoms FROM disease AS d
      LEFT JOIN patient_disease AS pd ON d.id = pd.disease_id 
      WHERE pd.patient_id IS NULL
      AND (
        name like CONCAT('%', ? ,'%') 
        OR symptoms like CONCAT('%', ? ,'%')
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

router.post("/addNewDisease", authDoctors, async (req, res) => {
  if (!req.body.diseaseId || !req.body.patientId) {
    return res.status(400).json({ msg: "Missing Data" });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await connection.query(
      `
      INSERT INTO patient_disease(patient_id,disease_id) 
      VALUES (? ,? )
    `,
      [req.body.patientId, req.body.diseaseId]
    );

    await connection.query(
      `
      INSERT INTO patient_disease_history(id,patient_id,disease_id) 
      VALUES (? ,? ,? )
    `,
      [result[0].insertId, req.body.patientId, req.body.diseaseId]
    );

    await connection.commit();
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
      SELECT id,name,JSON_EXTRACT(symptoms,'$') AS symptoms FROM disease WHERE id =? LIMIT 1
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

router.get("/patient/info", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT d.id,d.name,JSON_EXTRACT(d.symptoms,'$') AS symptoms,pd.id AS pdid FROM disease AS d
        INNER JOIN patient_disease AS pd 
        ON d.id = pd.disease_id 
        WHERE pd.patient_id = ?
        `,
      [req.query.patientId != "null" ? req.query.patientId : req.token.id]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/patient/mydiseases", authPatients, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT d.id,d.name,JSON_EXTRACT(d.symptoms,'$') AS symptoms FROM disease AS d
        INNER JOIN patient_disease AS pd 
        ON d.id = pd.disease_id 
        WHERE pd.patient_id = ?
        `,
      [req.token.id]
    );
    if (result[0].length === 0)
      return res.status(400).json({ msg: "No Medicine" });

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.delete("/removeDisease", authDoctors, async (req, res) => {
  if (!req.body.diseaseId || !req.body.patientId) {
    return res.status(400).json({ msg: "There is no disease with this ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM patient_disease WHERE disease_id=? AND patient_id = ?",
      [req.body.diseaseId, req.body.patientId]
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

module.exports = router;
