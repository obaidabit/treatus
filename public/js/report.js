let url = new URLSearchParams(location.search);

function getDiseases(patient_id) {
  document.getElementById("patdiseases").innerHTML = "";
  const disselected = document.createElement("option");
  document.getElementById("patdiseases").appendChild(disselected);
  fetch(`diseases/patient/info?patientId=${patient_id}`)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((dis) => {
        const disselected = document.createElement("option");
        disselected.innerText = dis.name;
        disselected.value = dis.pdid;
        document.getElementById("patdiseases").appendChild(disselected);
      });
    });
}

function generateCalendarMatrix(year, month) {
  const weeks = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  let currentDate = startDate;

  while (currentDate <= lastDayOfMonth || weeks.length < 5) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getMedicines(patient_id) {
  document.getElementById("patmedicines").innerHTML = "";
  fetch(
    `medicines/patientDiseaseMedicines?patientId=${patient_id}&patientDiseaseId=${
      document.getElementById("patdiseases").value
    }`
  )
    .then((res) => res.json())
    .then((medicines) => {
      medicines.forEach((element) => {
        const patmedicines = document.createElement("div");
        patmedicines.innerHTML = `<div class="card">
          <div class="card-body">
            <h5 class="card-title">${element.name}</h5>
            <h6 class="card-subtitle mb-2 text-muted">
              ${element.drug_use}
            </h6>
            <button
                class="btn btn-main mt-3 selectmed"
                type="button"
                data-medicine-id=${element.patient_medicine_id}
              >
                Select
              </button>
          </div>
        </div>`;
        patmedicines.className = "col-sm-12 col-md-4 col-lg-3 mb-4";
        document.getElementById("patmedicines").appendChild(patmedicines);
      });
      document.querySelectorAll(".selectmed").forEach((element) => {
        element.addEventListener("click", (event) => {
          document.querySelector("#calender tbody").innerHTML = "";
          document.querySelector("#monthInput").value = "";
          document
            .getElementById("medmonthselected")
            .classList.remove("d-none");
          document.getElementById("monthInput").dataset.medicineId =
            event.target.dataset.medicineId;
        });
      });
    });
}
document.getElementById("patdiseases").addEventListener("change", () => {
  getMedicines(url.get("patientId"));
  document.getElementById("medmonthselected").classList.add("d-none");
});

getDiseases(url.get("patientId"));

function getDoctors(patient_id) {
  document.getElementById("doctorname").innerHTML = "";
  const doctorselected = document.createElement("option");
  document.getElementById("doctorname").appendChild(doctorselected);
  fetch(`doctors/patient_doctors?patientId=${patient_id}`)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((dis) => {
        const doctorsselected = document.createElement("option");
        doctorsselected.innerText = `Dr.${dis.full_name}`;
        doctorsselected.value = dis.id;
        document.getElementById("doctorname").appendChild(doctorsselected);
      });
    });
}
getDoctors(url.get("patientId"));

document.getElementById("doctorname").addEventListener("change", () => {
  fetch(
    `appointments/info/appointmentsNotes?patientId=${url.get(
      "patientId"
    )}&doctorId=${document.getElementById("doctorname").value}`
  )
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("doctorsnotes").innerHTML = "";
      data.forEach((note) => {
        let date = "";
        if (note.date) {
          const appDate = new Date(note.date);
          date = `${appDate.getFullYear()}-${
            appDate.getMonth() + 1
          }-${appDate.getDate()}`;
        }
        const doctorsnotes = document.createElement("div");
        doctorsnotes.className = `col-sm-12 col-md-6 col-lg-6 mb-4`;
        doctorsnotes.innerHTML = `<div class="card">
        <div class="card-header">Dr.${note.full_name} &nbsp;&nbsp;&nbsp; ${date}</div>
        <div class="card-body">
        ${note.notes}
        </div>
      </div>`;
        document.getElementById("doctorsnotes").appendChild(doctorsnotes);
      });
    });
});

document.getElementById("monthInput").addEventListener("change", (event) => {
  fetch(
    `/potion_logs/month?medicineId=${
      event.target.dataset.medicineId
    }&patientId=${url.get("patientId")}&date=${event.target.value}`
  )
    .then((res) => res.json())
    .then((data) => {
      document.querySelector("#calender tbody").innerHTML = "";
      const selectedDate = event.target.valueAsDate;
      const selectedMonthWeeks = generateCalendarMatrix(
        selectedDate.getFullYear(),
        selectedDate.getMonth()
      );
      for (let week of selectedMonthWeeks) {
        const tr = document.createElement("tr");

        for (let day of week) {
          const td = document.createElement("td");

          if (day.getDay() === 5 || day.getDay() === 6)
            td.className = "weekend";

          const span = document.createElement("span");
          const div = document.createElement("div");

          if (day.getDate() === 1)
            div.innerText =
              day.toLocaleString("en-US", { month: "long" }) +
              " " +
              day.getDate();
          else div.innerText = day.getDate();
          span.className = "date";
          span.appendChild(div);

          const potions = data.filter((po) => {
            const potionDate = new Date(po.date);

            return (
              potionDate.getDate() === day.getDate() &&
              potionDate.getMonth() === day.getMonth() &&
              potionDate.getFullYear() === day.getFullYear()
            );
          });

          potions.forEach((potion) => {
            const potionDiv = document.createElement("div");
            potionDiv.className =
              "bg-light-blue d-flex justify-content-between px-2 border-top border-light";
            potionDiv.innerHTML = `
              <span>${potion.pill_number} Pill </span>
              <span>${potion.take_time} </span>`;
            span.appendChild(potionDiv);
          });

          td.appendChild(span);
          tr.appendChild(td);
        }

        document.querySelector("#calender tbody").appendChild(tr);
      }
    });
});
