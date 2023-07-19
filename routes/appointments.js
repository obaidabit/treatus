const express = require("express");
const pool = require("../database");
const { authPatients, authDoctors } = require("../middleware/auth");
const router = express.Router();
const moment = require("moment-timezone");
const {
  scheduleAppointmentNotification,
  deleteNotification,
} = require("./cron");
const END_TIME = 16;
const START_TIME = 9;

router.get("/todayAppointments", authDoctors, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*,p.full_name FROM appointment AS a 
      INNER JOIN patient AS p ON a.patient_id = p.id
      WHERE a.date=str_to_date(?,'%d/%m/%Y') AND a.doctor_id = ?`,
      [new Date().toLocaleDateString("en-GB"), req.token.id]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/patient/weekAppointments", authPatients, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*,d.full_name FROM appointment AS a 
      INNER JOIN doctor AS d ON a.doctor_id = d.id
      WHERE a.date >= str_to_date(?,'%d/%m/%Y')
      AND a.date <= str_to_date(?,'%d/%m/%Y')
      AND a.patient_id = ?`,
      [
        moment().utcOffset(3).format("DD/MM/YYYY"),
        moment().utcOffset(3).add(1, "week").format("DD/MM/YYYY"),
        req.token.id,
      ]
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/info", authDoctors, async (req, res) => {
  try {
    if (!req.query.appointmentId) {
      return res.status(400).json({ msg: "Missing Data" });
    }
    const result = await pool.query(
      `
        SELECT * FROM appointment WHERE id = ?
        `,
      [req.query.appointmentId]
    );

    res.json(result[0][0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get("/info/appointmentsNotes", async (req, res) => {
  try {
    if (!req.query.doctorId || !req.query.patientId) {
      return res.status(400).json({ msg: "Missing Data" });
    }
    let patientId;

    if (req.query.patientId != "null") {
      patientId = req.query.patientId;
    } else {
      patientId = req.token.id;
    }

    const result = await pool.query(
      `
        SELECT a.id,a.notes,a.date,d.full_name FROM appointment AS a
        INNER JOIN doctor AS d ON d.id = a.doctor_id
        WHERE a.doctor_id = ? AND a.patient_id = ? AND a.notes <> ''
        `,
      [req.query.doctorId, patientId]
    );
    if (result[0].length === 0)
      return res.status(400).json({ msg: "No Appointments found" });
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.get(
  "/search/filter",

  async (req, res) => {
    let whereStatment = "";
    let values = [moment().utcOffset(3).format("DD/MM/YYYY"), req.token.id];

    let type = "";
    let joinStatment = "";
    let userId;
    let userColumn = "";
    if (req.token.type === "doctor") {
      type = "AND doctor_id=?";
      joinStatment = "INNER JOIN patient AS p ON a.patient_id = p.id";
      userId = req.query.patientId;
      userColumn = "a.patient_id=?";
    } else {
      type = "AND patient_id=?";
      joinStatment = "INNER JOIN doctor AS p ON a.doctor_id = p.id";
      userId = req.query.doctorId;
      userColumn = "a.doctor_id=?";
    }

    if (req.query.startDate && req.query.endDate && userId) {
      whereStatment = `WHERE a.date >= str_to_date(?,'%d/%m/%Y') AND a.date <= str_to_date(?,'%d/%m/%Y') AND ${userColumn}`;
      values = [
        moment(req.query.startDate).utcOffset(3).format("DD/MM/YYYY"),
        moment(req.query.endDate).utcOffset(3).format("DD/MM/YYYY"),
        userId,
        req.token.id,
      ];
    } else if (req.query.startDate && req.query.endDate) {
      whereStatment =
        "WHERE a.date >= str_to_date(?,'%d/%m/%Y') AND a.date <= str_to_date(?,'%d/%m/%Y')";
      values = [
        moment(req.query.startDate).utcOffset(3).format("DD/MM/YYYY"),
        moment(req.query.endDate).utcOffset(3).format("DD/MM/YYYY"),
        req.token.id,
      ];
    } else if (req.query.startDate && userId) {
      whereStatment = `WHERE a.date >= str_to_date(?,'%d/%m/%Y') AND ${userColumn}`;
      values = [
        moment(req.query.startDate).utcOffset(3).format("DD/MM/YYYY"),
        userId,
        req.token.id,
      ];
    } else if (req.query.endDate && userId) {
      whereStatment = `WHERE a.date <= str_to_date(?,'%d/%m/%Y') AND ${userColumn}`;
      values = [
        moment(req.query.endDate).utcOffset(3).format("DD/MM/YYYY"),
        userId,
        req.token.id,
      ];
    } else if (req.query.startDate) {
      whereStatment = "WHERE a.date >= str_to_date(?,'%d/%m/%Y')";
      values = [
        moment(req.query.startDate).utcOffset(3).format("DD/MM/YYYY"),
        req.token.id,
      ];
    } else if (req.query.endDate) {
      whereStatment = "WHERE a.date <= str_to_date(?,'%d/%m/%Y')";
      values = [
        moment(req.query.endDate).utcOffset(3).format("DD/MM/YYYY"),
        req.token.id,
      ];
    } else if (userId) {
      whereStatment = `WHERE ${userColumn}`;
      values = [userId, req.token.id];
    } else {
      whereStatment = "WHERE a.date=str_to_date(?,'%d/%m/%Y') ";
    }

    whereStatment = whereStatment + type;
    try {
      const result = await pool.query(
        `SELECT a.*,p.full_name FROM appointment AS a 
        ${joinStatment}
        ${whereStatment}
        `,
        values
      );

      res.json(result[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Something went wrong please try again" });
    }
  }
);

router.get("/getAvailableAppointments", authPatients, async (req, res) => {
  let allAppointments = [];

  if (!req.query.appointmentdate) {
    return res.status(400).json({ msg: "Please select a Date" });
  }

  if (!parseInt(req.query.doctor_id)) {
    return res.status(400).json({ msg: "Wrong doctor id" });
  }

  const todayDate = moment().utcOffset(3);
  const appointmentDate = moment(req.query.appointmentdate, false).utcOffset(3);

  const isPassedEndTime =
    todayDate.date() === appointmentDate.date() &&
    todayDate.hour() > END_TIME &&
    todayDate.minute() > 0;

  if (appointmentDate.date() < todayDate.date() || isPassedEndTime) {
    return res
      .status(400)
      .json({ msg: "You cannot choose a date in the past" });
  }

  const startDate = appointmentDate
    .clone()
    .set({ hour: START_TIME, minute: 0, second: 0 });
  const endDate = appointmentDate
    .clone()
    .set({ hour: END_TIME, minute: 0, second: 0 });

  if (startDate.date() === todayDate.date()) {
    startDate.set({ hour: todayDate.hour() });
  }

  for (
    let currentDate = startDate.clone();
    currentDate <= endDate;
    currentDate.add(30, "minute")
  ) {
    allAppointments.push(currentDate.format("YYYY-MM-DD hh:mm:ss"));
  }

  try {
    const result = await pool.query(
      `
      SELECT * FROM appointment
      WHERE date=str_to_date(?,'%d/%m/%Y')
      AND doctor_id = ?`,
      [startDate.format("DD/MM/YYYY"), req.query.doctor_id]
    );

    result[0].forEach((app) => {
      allAppointments = allAppointments.filter(
        (it) => moment(it).format("hh:mm:ss") !== app.start_time
      );
    });

    res.json(allAppointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.post("/book", authPatients, async (req, res) => {
  if (!req.body.appointmentDate || !req.body.doctor_id) {
    return res.status(400).json({ msg: "Messing Date" });
  }

  try {
    const date = moment(req.body.appointmentDate).utcOffset(3);
    const result = await pool.query(
      `
        INSERT INTO appointment(date,doctor_id,patient_id,start_time,end_time,finished)
        SELECT ?,?,?,?,?,? FROM DUAL
        WHERE NOT EXISTS (
          SELECT a.id FROM appointment as a WHERE a.date=str_to_date(? ,'%Y-%m-%d') 
          AND a.doctor_id = ?
          AND a.patient_id = ? 
          AND a.start_time = TIME(?) LIMIT 1
        )
      `,
      [
        date.format("YYYY-MM-DD"),
        req.body.doctor_id,
        req.token.id,
        date.format("hh:mm:ss"),
        date.clone().add(30, "minute").format("hh:mm:ss"),
        0,
        date.format("YYYY-MM-DD"),
        req.body.doctor_id,
        req.token.id,
        date.format("hh:mm:ss"),
      ]
    );

    scheduleAppointmentNotification(
      {
        id: result[0].insertId,
        start_time: date.format("hh:mm:ss"),
        date: date.format("YYYY-MM-DD"),
      },
      req.token.id
    );

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.post("/saveAppointment", authDoctors, async (req, res) => {
  if (!req.body.appointmentId) {
    res.status(400).json({ msg: "Missing Data" });
  }
  try {
    const result = await pool.query(
      `
      UPDATE appointment SET notes = ? , finished = ?
      WHERE id = ?
    `,
      [req.body.notes, 1, req.body.appointmentId]
    );
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.delete("/patient/removeAppointment", authPatients, async (req, res) => {
  if (!req.body.appointmentId) {
    return res.status(400).json({ msg: "There is no Appoitment with this ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM appointment WHERE id=? AND patient_id=?",
      [req.body.appointmentId, req.token.id]
    );

    deleteNotification(`app-${req.body.appointmentId}`);
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

router.delete("/doctor/removeAppointment", authDoctors, async (req, res) => {
  if (!req.body.appointmentId) {
    return res.status(400).json({ msg: "There is no Appoitment with this ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM appointment WHERE id=? AND doctor_id=?",
      [req.body.appointmentId, req.token.id]
    );

    deleteNotification(`app-${req.body.appointmentId}`);
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});
module.exports = router;
