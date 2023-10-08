const express = require("express");
const { authPatients } = require("../middleware/auth");
const pool = require("../database");
const {
  schedulePotionNotification,
  scheduleAppointmentNotification,
} = require("./cron");
const router = express.Router();

let subscribers = [];

//  Bring potions and patient subscriptions information from subscriptions and loop over every potion
//  and pass it as a parameter to the function schedulePotionNotification
//  that function prepare the notification to show up at the right time of the potion itself

async function setupAllPatientNotifications() {
  console.log("Notification setup started");
  try {
    const result = await pool.query(
      `
      SELECT s.*,potion.id as potionId,potion.time,potion.days,m.name,potion.pill_number FROM subscriptions AS s
      INNER JOIN potion AS potion ON s.patient_id = potion.patient_id 
      INNER JOIN patient_medicine AS pm ON potion.medicine_id = pm.id
      INNER JOIN medicine AS m ON pm.medicine_id = m.id 
      `
    );
    const appResult = await pool.query(
      `
      SELECT * FROM appointment
      `
    );

    for (let potion of result[0]) {
      schedulePotionNotification(
        {
          ...potion,
          id: potion.potionId,
        },
        potion.patient_id
      );
    }
    for (let app of appResult[0]) {
      scheduleAppointmentNotification(app, app.patient_id);
    }
  } catch (error) {
    console.error(error);
  }
}

// setupAllPatientNotifications();

//  the patient send the request to the server to record him in the server to respond notifications
//  endpoint the url of the patient and key the unique of the patient
//  the key is two parts p256dh and auth

router.post("/", authPatients, async (req, res) => {
  const subscriptionData = req.body;
  subscribers.push(subscriptionData);

  const { endpoint, keys } = req.body;

  if (!endpoint || !keys) return res.status(400).json({ msg: "missing data" });

  try {
    const result = await pool.query(
      "SELECT id FROM subscriptions WHERE patient_id=? AND endpoint=?", // patient id
      [req.token.id, endpoint]
    );

    if (result[0].length > 0)
      return res.json({ msg: "You are already subscribed" });

    const query =
      "INSERT INTO subscriptions (patient_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)";
    const values = [req.token.id, endpoint, keys.p256dh, keys.auth];

    const insertResult = await pool.query(query, values);

    if (insertResult[0] && insertResult[0].affectedRows)
      res.status(200).json({ msg: "Subscription successful." });
    else res.status(500).json({ msg: "Something went wrong please try again" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong please try again" });
  }
});

module.exports = {
  router,
  setupAllPatientNotifications,
};
