const express = require("express");
const Joi = require("joi");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../database");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { authDoctors, authPatients } = require("../middleware/auth");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, os.tmpdir());
  },
  filename: (req, file, callBack) => {
    callBack(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });
const saltRounds = 10;

async function uploadImg(imgPath) {
  const uploadClient = await import("@uploadcare/upload-client");
  const client = new uploadClient.UploadClient({
    publicKey: process.env.UPLOADCARE_API_KEY,
  });
  const file = fs.readFileSync(imgPath);
  const uploadResult = await client.uploadFile(file);
  return uploadResult;
}

router.get("/latest", authPatients, async (req, res) => {
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

//STEP 1.1: a Route searching about doctors by Name or Specialization
//          Case if searching by Name or specialization
//          and update SQL query Based on Name or Specialization
router.get("/search", authPatients, async (req, res) => {
  if (!req.query.text && !req.query.specialization) {
    return res.status(400).json({ msg: "Nothing to search" });
  }

  let spec = "";
  let name = "";
  let addAndSQL = "";
  const values = [];

  if (req.query.text) {
    name = "full_name LIKE CONCAT('%', ? ,'%')";
    values.push(req.query.text);
  }
  if (req.query.specialization) {
    spec = "specialization LIKE CONCAT('%', ? ,'%')";
    values.push(req.query.specialization);
  }

  if (name && spec) {
    addAndSQL = "AND";
  } else {
    addAndSQL = "";
  }

  try {
    const result = await pool.query(
      `SELECT * FROM doctor 
      WHERE ${name} ${addAndSQL} ${spec} ORDER BY id DESC LIMIT 50`,
      values
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/my_doctors", authPatients, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.* FROM doctor AS d
      INNER JOIN doctor_patient AS dp ON d.id = dp.doctor_id
      WHERE dp.patient_id = ? 
      `,
      [req.token.id]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});
//STEP 2.1: a Route that gives doctors information without permissions
router.get("/patient_doctors", async (req, res) => {
  let patientId;

  if (req.query.patientId != "null") {
    patientId = req.query.patientId;
  } else {
    patientId = req.token.id;
  }
  try {
    const result = await pool.query(
      `SELECT d.* FROM doctor AS d
      INNER JOIN doctor_patient AS dp ON d.id = dp.doctor_id
      WHERE dp.patient_id = ? 
      `,
      [patientId]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/info", authDoctors, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM doctor WHERE id=? limit 1", [
      req.token.id,
    ]);

    res.json(result[0][0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/specialization/", authPatients, async (req, res) => {
  if (!req.query.specialization) {
    res.status(400).json({ msg: "you need to specify doctor specialization" });
    return;
  }
  try {
    const result = await pool.query(
      "SELECT * FROM doctor WHERE specialization=?",
      [req.token.specialization]
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/specialization/all", authPatients, async (req, res) => {
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

const updateSchema = Joi.object({
  fullname: Joi.string().min(5).max(50).required(),
  address: Joi.string().min(5).max(200),
  email: Joi.string().email().required(),
});

router.post(
  "/update",
  [authDoctors, upload.single("image")],
  async (req, res) => {
    const schemaResult = updateSchema.validate({
      fullname: req.body.fullname,
      address: req.body.address,
      email: req.body.email,
    });

    if (schemaResult.error)
      return res.status(400).json({ msg: schemaResult.error.message });

    let uploadedFile = null;

    let sqlUpdate =
      "UPDATE doctor SET full_name=? ,address=?, email=? WHERE id=?";
    let values = [
      req.body.fullname,
      req.body.address,
      req.body.email,
      req.token.id,
    ];

    if (req.file) {
      uploadedFile = await uploadImg(req.file.path);
      sqlUpdate =
        "UPDATE doctor SET full_name=? ,address=?, email=? ,image=? WHERE id=?";
      values = [
        req.body.fullname,
        req.body.address,
        req.body.email,
        uploadedFile?.cdnUrl,
        req.token.id,
      ];
    }

    if (req.body.password) {
      if (req.file) {
        sqlUpdate =
          "UPDATE doctor SET full_name=? ,address=?, email=?, password=?, image=? WHERE id=?";
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
        values = [
          req.body.fullname,
          req.body.address,
          req.body.email,
          hashedPassword,
          uploadedFile?.cdnUrl,
          req.token.id,
        ];
      } else {
        sqlUpdate =
          "UPDATE doctor SET full_name=? ,address=?, email=?, password=? WHERE id=?";
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
        values = [
          req.body.fullname,
          req.body.address,
          req.body.email,
          hashedPassword,
          req.token.id,
        ];
      }
    }
    try {
      await pool.query(sqlUpdate, values);
      res.redirect("/profile");
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Something went wrong please try again" });
    }
  }
);

router.post("/mypatients/addNewPatient", authDoctors, async (req, res) => {
  if (!req.body.patientId) {
    res.status(400).json({ msg: "Nothing to Add" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO doctor_patient(patient_id,doctor_id) VALUES(?,?)`,
      [req.body.patientId, req.token.id]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.delete("/mypatients/removePatient", authDoctors, async (req, res) => {
  if (!req.body.patientId) {
    res.status(400).json({ msg: "Nothing to Delete" });
    return;
  }
  try {
    const result = await pool.query(
      `DELETE FROM doctor_patient WHERE doctor_id = ? AND patient_id = ?`,
      [req.token.id, req.body.patientId]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});
module.exports = router;
