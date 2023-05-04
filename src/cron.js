const cron = require("node-cron");
const webpush = require("web-push");
const moment = require("moment-timezone");
const pool = require("../database");

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
      // console.log(response);
    })
    .catch((error) => {
      console.log(error);
    });
}

async function scheduleAppointmentNotification(appointment, patient_id) {
  let timeString = "";
  const hour = appointment.start_time.split(":")[0];
  const timeFormat = parseInt(hour) < 5 ? "PM" : "AM";

  if (typeof appointment.date === "string")
    timeString = `${appointment.date} ${appointment.start_time} ${timeFormat}`;
  else
    timeString = `${appointment.date.getFullYear()}-${
      appointment.date.getMonth() + 1
    }-${appointment.date.getDate()} ${appointment.start_time} ${timeFormat}`;

  const time = moment(timeString, "YYYY-MM-DD HH:mm:ss A")
    .utcOffset(3)
    .subtract(30, "minute");

  const today = moment().utcOffset(3);

  if (time.isBefore(today, "day")) return;

  const result = await pool.query(
    "SELECT * FROM subscriptions WHERE patient_id=?",
    [patient_id]
  );

  if (result[0].length === 0) return;

  const subscriptionData = {
    endpoint: result[0][0].endpoint,
    keys: {
      p256dh: result[0][0].p256dh,
      auth: result[0][0].auth,
    },
  };

  const messageData = {
    title: "Appointment reminder",

    body: `You have Doctor Appointment at ${appointment.start_time} `,
    url: "/appointments",
  };

  cron.schedule(
    `${time.format("m")} ${time.format("H")} ${time.format("D")} ${time.format(
      "M"
    )} *`,
    () => {
      console.log("Sinding Notification");
      sendNotification(subscriptionData, messageData);
    },
    { name: `app-${appointment.id}` }
  );
}

async function schedulePotionNotification(potion, patient_id) {
  const time = moment(potion.time, "HH:mm:ss").utcOffset(3);
  const result = await pool.query(
    "SELECT * FROM subscriptions WHERE patient_id=?",
    [patient_id]
  );

  if (result[0].length === 0) return;

  const subscriptionData = {
    endpoint: result[0][0].endpoint,
    keys: {
      p256dh: result[0][0].p256dh,
      auth: result[0][0].auth,
    },
  };

  const messageData = {
    title: "Your medication reminder",
    body: `It is time to take your medication \n${potion.name}.`,
    url: "/home",
  };
  const weekDays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  switch (potion.days) {
    case "every day":
      cron.schedule(
        `${time.format("m")} ${time.format("H")} * * *`,
        () => {
          sendNotification(subscriptionData, messageData);
        },
        { name: potion.id }
      );
      break;
    case "every other day":
      cron.schedule(
        `${time.format("m")} ${time.format("H")} */2 * *`,
        () => {
          sendNotification(subscriptionData, messageData);
        },
        { name: potion.id }
      );
      break;
    default:
      const days = potion.days.split(",");
      const cronDays = [];

      for (let day of days) {
        if (weekDays.includes(day)) {
          cronDays.push(weekDays.indexOf(day));
        }
      }

      const cronTime = `${time.format("m")} ${time.format(
        "H"
      )} * * ${cronDays.join(",")}`;
      cron.schedule(
        cronTime,
        () => {
          sendNotification(subscriptionData, messageData);
        },
        { name: potion.id }
      );
      break;
  }
}

function deleteNotification(name) {
  cron.getTasks().get(name)?.stop();
  cron.getTasks().delete(name);
}

function updatePotionNotification(name, potion, patient_id) {
  deleteNotification(name);
  schedulePotionNotification(potion, patient_id);
}

function updateAppointmentNotification(name, appointment, patient_id) {
  deleteNotification(name);
  schedulePotionNotification(appointment, patient_id);
}

module.exports = {
  sendNotification,
  schedulePotionNotification,
  updatePotionNotification,
  deleteNotification,
  scheduleAppointmentNotification,
  updateAppointmentNotification,
};
