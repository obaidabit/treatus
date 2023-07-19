const express = require("express");
const path = require("path");
const router = express.Router();

//    sendFile function send the file that needs a path
//    and join function mix many strings to give the path correctly
//    Token contains user information who requests the route
router.get("/home", (req, res) => {
  if (req.token.type === "doctor") {
    res.sendFile(path.join(__dirname, "../public", "Doctor Home.html"));
  } else {
    res.sendFile(path.join(__dirname, "../public", "Patient Home.html"));
  }
});

router.get("/profile", (req, res) => {
  if (req.token.type === "doctor") {
    res.sendFile(path.join(__dirname, "../public", "Doctor Profile.html"));
  } else {
    res.sendFile(path.join(__dirname, "../public", "Patient Profile.html"));
  }
});

router.get("/appointments", (req, res) => {
  if (req.token.type === "doctor") {
    res.sendFile(path.join(__dirname, "../public", "Doctor Appointments.html"));
  } else {
    res.sendFile(
      path.join(__dirname, "../public", "Patient Appointments.html")
    );
  }
});

router.get("/addNewPatient", (req, res) => {
  if (req.token.type === "patient") res.status(404).redirect("/notfound");

  res.sendFile(
    path.join(__dirname, "../public", "Doctor Add New Patient.html")
  );
});

router.get("/patientsList", (req, res) => {
  if (req.token.type === "patient") res.status(404).redirect("/notfound");

  res.sendFile(path.join(__dirname, "../public", "Doctor Patients List.html"));
});

router.get("/viewAppointment", (req, res) => {
  if (req.token.type === "patient") res.status(404).redirect("/notfound");

  res.sendFile(
    path.join(__dirname, "../public", "Doctor View Appointment.html")
  );
});

router.get("/patientInfo", (req, res) => {
  if (req.token.type === "patient") res.status(404).redirect("/notfound");

  res.sendFile(path.join(__dirname, "../public", "Doctor Patient Info.html"));
});

router.get("/bookAppointment", (req, res) => {
  if (req.token.type === "doctor") res.status(404).redirect("/notfound");

  res.sendFile(
    path.join(__dirname, "../public", "Patient Book Appointment.html")
  );
});

router.get("/DiseasesandMedicines", (req, res) => {
  if (req.token.type === "doctor") res.status(404).redirect("/notfound");

  res.sendFile(
    path.join(__dirname, "../public", "Patient Diseases and Medicines.html")
  );
});

router.get("/report", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "Report.html"));
});

module.exports = router;
