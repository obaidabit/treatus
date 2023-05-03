const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
dotenv.config();

process.env.TZ = "Etc/GMT-3";

const { checkLogin } = require("./middleware/auth");
const patientsRouter = require("./src/patients");
const doctorsRouter = require("./src/doctors");
const appointmentsRouter = require("./src/appointments");
const medicineRouter = require("./src/medicine");
const diseaseRouter = require("./src/disease");
const userRouter = require("./src/user");
const potionsRouter = require("./src/potions");
const publicRouter = require("./src/public");
const potionLogsRouter = require("./src/potion_logs");
const uiRouter = require("./src/ui");
const subscribeRouter = require("./src/subscribes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/publicApi", publicRouter);

app.get("/doctors", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "doctors.html"));
});
app.get("/medicines", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "medicines.html"));
});
app.get("/medicine_info", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "medicine info.html"));
});
app.get("/diseases", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Diseases.html"));
});
app.get("/disease_info", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Disease Info.html"));
});

app.use("/auth", userRouter);
app.use(express.static("public"));

app.get("/offline", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "offline.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});
app.use(checkLogin);

app.get("/user", (req, res) => {
  res.json(req.token);
});
app.use(uiRouter);
app.use("/patients", patientsRouter);
app.use("/doctors", doctorsRouter);
app.use("/appointments", appointmentsRouter);
app.use("/medicines", medicineRouter);
app.use("/diseases", diseaseRouter);
app.use("/potions", potionsRouter);
app.use("/potion_logs", potionLogsRouter);
app.use("/subscribe", subscribeRouter);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running");
});
