const express = require("express");
const pool = require("../database");
// const wiki = require("wikipedia");
const wiki = require("wikijs").default;
const router = express.Router();

router.get("/doctors/latest", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM doctor ORDER BY id DESC LIMIT 8"
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/doctors/search", async (req, res) => {
  let spec = "";
  let name = "";
  const values = [];
  if (req.query.text) {
    name = "AND full_name LIKE CONCAT('%', ? ,'%')";
    values.push(req.query.text);
  }
  if (req.query.specialization) {
    spec = "AND specialization LIKE CONCAT('%', ? ,'%')";
    values.push(req.query.specialization);
  }
  try {
    const result = await pool.query(
      `SELECT * FROM doctor WHERE 1=1 ${name} ${spec} ORDER BY id DESC LIMIT 50`,
      values
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/doctors/specialization/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT specialization FROM doctor"
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/medicines/latest", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM medicine ORDER BY id DESC LIMIT 8"
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/medicines/search", async (req, res) => {
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

router.get("/diseases/search", async (req, res) => {
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

router.get("/diseases/latest", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,name,JSON_EXTRACT(symptoms,'$') AS symptoms FROM disease 
      ORDER BY id DESC LIMIT 8`
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/diseases/search/info", async (req, res) => {
  try {
    const page = await wiki().page(req.query.text);
    const content = await page.content();
    res.json({ content: content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});
module.exports = router;
