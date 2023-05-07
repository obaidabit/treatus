const express = require("express");
const Joi = require("joi");
const router = express.Router();
const pool = require("../database");
const os = require("os");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, os.tmpdir()); // './public/images/' directory name where save the file
  },
  filename: (req, file, callBack) => {
    callBack(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });
const {
  authDoctors,
  authPatientDoctors,
  authPatientInfo,
  authDoctorInfo,
  authPatients,
} = require("../middleware/auth");

async function uploadImg(imgPath) {
  const uploadClient = await import("@uploadcare/upload-client");
  const client = new uploadClient.UploadClient({
    publicKey: process.env.UPLOADCARE_API_KEY,
  });
  const file = fs.readFileSync(imgPath);
  const uploadResult = await client.uploadFile(file);
  return uploadResult;
}

router.get("/latest", authDoctors, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT p.*,
            CASE WHEN dp.doctor_id = ? THEN 'true' ELSE 'false' END AS 'is_my_patient'
      FROM patient AS p
      LEFT JOIN doctor_patient AS dp ON p.id = dp.patient_id AND dp.doctor_id = ?
      ORDER BY p.id DESC
      LIMIT 8`,
      [req.token.id, req.token.id]
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/info", authDoctors, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM patient WHERE id=?", [
      req.query.patientId,
    ]);

    res.json(result[0][0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/info/my", authPatients, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM patient WHERE id=?", [
      req.token.id,
    ]);
    if (result[0].length === 0)
      return res.status(400).json({ msg: "Invalid request" });

    res.json(result[0][0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

const updateSchema = Joi.object({
  fullname: Joi.string().min(5).max(50).required(),
  phone: Joi.string().min(10).max(13),
  height: Joi.number().integer().max(300),
  weight: Joi.number().integer().max(500),
  bloodtype: Joi.string().min(2).max(3),
  address: Joi.string().min(10).max(200),
  email: Joi.string().email().required(),
});

router.post(
  "/update",
  [authPatients, upload.single("image")],
  async (req, res) => {
    const schemaResult = updateSchema.validate({
      fullname: req.body.fullname,
      phone: req.body.phone,
      height: req.body.height,
      weight: req.body.weight,
      bloodtype: req.body.bloodtype,
      address: req.body.address,
      email: req.body.email,
    });

    if (schemaResult.error)
      return res.status(400).json({ msg: schemaResult.error.message });

    let sqlUpdate =
      "UPDATE patient SET full_name=?, phone=?, height=?, weight=?, blood_type=?, address=?, email=? WHERE id=?";
    let values = [
      req.body.fullname,
      req.body.phone,
      req.body.height,
      req.body.weight,
      req.body.bloodtype,
      req.body.address,
      req.body.email,
      req.token.id,
    ];

    let uploadedFile = null;

    if (req.file) {
      uploadedFile = await uploadImg(req.file.path);
      sqlUpdate =
        "UPDATE patient SET full_name=?, phone=?, height=?, weight=?, blood_type=?, address=?, email=?,image=? WHERE id=?";
      values = [
        req.body.fullname,
        req.body.phone,
        req.body.height,
        req.body.weight,
        req.body.bloodtype,
        req.body.address,
        req.body.email,
        uploadedFile?.cdnUrl,
        req.token.id,
      ];
    }
    if (req.body.password) {
      if (req.file) {
        sqlUpdate =
          "UPDATE patient SET full_name=?, phone=?, height=?, weight=?, blood_type=?, address=?, email=?, image=?, password=? WHERE id=?";
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
        values = [
          req.body.fullname,
          req.body.phone,
          req.body.height,
          req.body.weight,
          req.body.bloodtype,
          req.body.address,
          req.body.email,
          uploadedFile?.cdnUrl,
          hashedPassword,
          req.token.id,
        ];
      } else {
        sqlUpdate =
          "UPDATE patient SET full_name=?, phone=?, height=?, weight=?, blood_type=?, address=?, email=?, password=? WHERE id=?";
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
        values = [
          req.body.fullname,
          req.body.phone,
          req.body.height,
          req.body.weight,
          req.body.bloodtype,
          req.body.address,
          req.body.email,
          hashedPassword,
          req.token.id,
        ];
      }
    }

    try {
      const result = await pool.query(sqlUpdate, values);
      res.redirect("/profile");
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Something went wrong please try again" });
    }
  }
);

router.get("/all/search", authDoctors, async (req, res) => {
  if (!req.query.text) {
    res.status(400).json({ msg: "Nothing to search" });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT p.*,
        CASE WHEN dp.doctor_id = ? THEN 'true' ELSE 'false'
        END AS 'is_my_patient'
      FROM patient AS p
      LEFT JOIN doctor_patient AS dp ON p.id = dp.patient_id AND dp.doctor_id = ?
      WHERE full_name like CONCAT('%', ? ,'%') 
      LIMIT 20`,
      [req.token.id, req.token.id, req.query.text]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/doctor/search/", authDoctors, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM patient AS p 
      INNER JOIN doctor_patient AS dp ON p.id = dp.patient_id
      INNER JOIN doctor AS d ON dp.doctor_id = d.id
      WHERE d.id = ? AND p.full_name like CONCAT('%', ?,  '%') 
      LIMIT 20 `,
      [req.token.id, req.query.text]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/doctor/mypatients/", authDoctors, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM patient AS p 
      INNER JOIN doctor_patient AS dp ON p.id = dp.patient_id
      INNER JOIN doctor AS d ON dp.doctor_id = d.id
      WHERE d.id = ?
      LIMIT 20 `,
      [req.token.id]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});
module.exports = router;
