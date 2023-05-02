const express = require("express");
const webpush = require("web-push");
const cron = require("node-cron");
const moment = require("moment-timezone");
const { authPatients } = require("../middleware/auth");
const pool = require("../database");
const {
  schedulePotionNotification,
  scheduleAppointmentNotification,
} = require("./cron");
const router = express.Router();

let subscribers = [];

function sendNotification(subscriptionData, messageData) {
  const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: "mailto:obedabit1999@gmail.com",
  };

  webpush
    .sendNotification(subscriptionData, JSON.stringify(messageData), {
      vapidDetails: vapidKeys,
    })
    .then((response) => {
      //   console.log(response);
    })
    .catch((error) => {
      console.log(error);
    });
}

async function setupAllPatientNotifications() {
  try {
    const result = await pool.query(
      `
      SELECT s.*,p.id as potionId,p.time,p.days,m.name,p.pill_number FROM subscriptions AS s
      INNER JOIN potion AS p ON s.patient_id = p.patient_id 
      INNER JOIN patient_medicine AS pm ON p.medicine_id = pm.id
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

setupAllPatientNotifications();

router.post("/", authPatients, async (req, res) => {
  const subscriptionData = req.body;
  subscribers.push(subscriptionData);

  const { endpoint, keys } = req.body;

  if (!endpoint || !keys) return res.status(400).json({ msg: "missing data" });

  try {
    const result = await pool.query(
      "SELECT id FROM subscriptions WHERE patient_id=?",
      [req.token.id]
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

module.exports = router;
