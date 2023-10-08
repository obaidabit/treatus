// STEP 1.1: import for express and dotenv libraries
const express = require("express");
const dotenv = require("dotenv");

const path = require("path");
const cookieParser = require("cookie-parser");

// STEP 1.2: Creating an express object that represents the full app
//           Call the config function from dotenv library to read .env file content
const app = express();
dotenv.config();

process.env.TZ = "Etc/GMT-3";

const { checkLogin } = require("./middleware/auth");

const patientsRouter = require("./routes/patients");
const doctorsRouter = require("./routes/doctors");
const appointmentsRouter = require("./routes/appointments");
const medicineRouter = require("./routes/medicine");
const diseaseRouter = require("./routes/disease");
const userRouter = require("./routes/user");
const potionsRouter = require("./routes/potions");
const publicRouter = require("./routes/public");
const potionLogsRouter = require("./routes/potion_logs");
const uiRouter = require("./routes/ui");
const {
  subscribeRouter,
  setupAllPatientNotifications,
} = require("./routes/subscribes");

// STEP 2.1: using middlewares that convert the JSON encoded data to the JavaScript object
app.use(express.json());
//           using middlewares that convert the urlencoded data to the JavaScript object
app.use(express.urlencoded({ extended: true }));
//           using middlewares that deals with cookie requests
app.use(cookieParser());

// STEP 3.1: serving requests that no logged-in needed
app.use("/publicApi", publicRouter);
//           using Routes that serve html pages requests without login
//           sendFile function send the file that needs a path
//           and join function mix many strings to give the path correctly
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

// STEP 3.3: Using the Router that is responsible for authentication (login, logout and registration)
app.use("/auth", userRouter);

// STEP 3.2: Use middleware that makes the public folder static that can be requested with only names
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

// STEP 2.2: using middlewares that checking logins
app.use(checkLogin);

// STEP 2.3: Creating Route that gives logged-in users information
//           and send logged-in information as JSON encoded
//           using Routes that serve html pages requests
//           and serving requests at every logged-in user route
app.get("/user", (req, res) => {
  res.json(req.token); // Token === user information
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

// STEP 1.3: Starting up the server and listen on the port from .env file or direct from 5000 port number
app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running");
});

setupAllPatientNotifications();
