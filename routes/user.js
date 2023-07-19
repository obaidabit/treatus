const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../database");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const saltRounds = 10;

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(30).required(),
  accounttype: Joi.string().required(),
});

const registerSchema = Joi.object({
  fullname: Joi.string().min(5).max(50).required(),
  date: Joi.date().required(),
  gender: Joi.string()
    .pattern(new RegExp(/^(male|female)$/))
    .required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(30).required(),
  accounttype: Joi.string().required(),
  specialization: Joi.alternatives().conditional("accounttype", {
    is: "doctor",
    then: Joi.string().min(3).max(20),
    otherwise: Joi.optional(),
  }),
});

router.post("/login", async (req, res) => {
  const validateResult = loginSchema.validate({
    email: req.body.email,
    password: req.body.password,
    accounttype: req.body.accounttype,
  });

  if (validateResult.error) {
    return res.status(400).json({ msg: validateResult.error.message });
  }

  let tableName = null;
  if (req.body.accounttype === "doctor") {
    tableName = "doctor";
  } else {
    tableName = "patient";
  }
  let result;
  try {
    result = await pool.query(`SELECT * FROM ${tableName} WHERE email=?`, [
      req.body.email,
    ]);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: "Something went wrong please try again" });
  }

  if (!result || result[0].length === 0) {
    res.status(400).json({ msg: "User does not exist" });
    return;
  }

  const user = result[0][0];
  const isRightPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (isRightPassword) {
    const sign = jwt.sign(
      {
        id: user.id,
        full_name: user.full_name,
        type: tableName,
        email: user.email,
      },
      process.env.SECRET,
      { expiresIn: "30d" }
    );
    res
      .cookie("access-token", sign, { maxAge: 1000 * 60 * 60 * 24 * 30 })
      .json(user);
  } else {
    res
      .status(400)
      .cookie("access-token", "", { maxAge: -1 })
      .json({ msg: "Wrong Email or Password" });
  }
});

router.post("/register", async (req, res) => {
  const validateResult = registerSchema.validate({
    fullname: req.body.fullname,
    date: req.body.date,
    gender: req.body.gender,
    email: req.body.email,
    password: req.body.password,
    accounttype: req.body.accounttype,
    specialization: req.body.specialization,
  });

  if (validateResult.error) {
    return res.status(400).json({ msg: validateResult.error.message });
  }

  let tableName = null;
  let selectStatment = null;
  let values = null;
  if (req.body.accounttype === "doctor") {
    if (!req.body.specialization)
      return res.status(400).json({ msg: "Specialization is Required" });

    tableName = "doctor";
    selectStatment =
      "insert into doctor(full_name,date,gender,specialization,email,password) values(?,?,?,?,?,?)";
    values = [
      req.body.fullname,
      req.body.date,
      req.body.gender,
      req.body.specialization,
      req.body.email,
    ];
  } else {
    tableName = "patient";
    selectStatment =
      "insert into patient(full_name,date,gender,email,password) values(?,?,?,?,?)";
    values = [
      req.body.fullname,
      req.body.date,
      req.body.gender,
      req.body.email,
    ];
  }

  try {
    const existedEmail = await pool.query(
      `SELECT * FROM ${tableName} WHERE email=?`,
      [req.body.email]
    );

    if (existedEmail[0].length) {
      res.status(409).json({ msg: "User Already Exist. Please Login" });
      return;
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    values.push(hashedPassword);

    const result = await pool.query(selectStatment, values);
    res.status(201).json({ id: result[0].insertId, name: req.body.fullname });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.post("/logout", (req, res) => {
  res
    .cookie("access-token", "", { maxAge: -1 })
    .json({ msg: "Logged out Successfully" });
});

module.exports = router;
