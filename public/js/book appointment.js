let doctorId;

document.getElementById("searshapp").addEventListener("click", () => {
  const appodate = document.getElementById("appointmentdate").value;
  if (appodate) {
    fetch(
      `appointments/getAvailableAppointments?appointmentdate=${appodate}&doctor_id=${doctorId}`
    )
      .then((data) => data.json())
      .then((arrayapp) => {
        arrayapp.forEach((element) => {
          const appo = document.createElement("div");
          appo.className = "col-sm-12 col-lg-4 mb-3";
          appo.innerHTML = `<div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <h5 class="card-title">${element}</h5>
            </div>
            <button data-date="${element}" class="card-link selectappo btn bg-transparent p-0">Select</button>
          </div>
        </div>`;
          document.getElementById("Appointments").appendChild(appo);
        });
        document.querySelectorAll(".selectappo").forEach((click) => {
          click.addEventListener("click", (event) => {
            fetch("appointments/book", {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                appointmentDate: event.target.dataset.date,
                doctor_id: doctorId,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.affectedRows) {
                  const msg = document.getElementById("successmsg");
                  msg.classList.remove("d-none");
                  msg.innerText = " appointment booked successfuly";
                  event.target.disabled = true;
                }
              });
          });
        });
      });
  }
});

fetch("doctors/specialization/all")
  .then((res) => res.json())
  .then((data) => {
    data.forEach((speci) => {
      const option = document.createElement("option");
      option.value = speci.specialization;
      option.innerText = speci.specialization;
      document.getElementById("specialization").appendChild(option);
    });
  });
document.getElementById("searchdoctor").addEventListener("click", () => {
  let url = "";
  const doctorname = document.getElementById("inputdoctorname");
  const specializationvalue = document.getElementById("specialization");
  if (!doctorname.value && specializationvalue.value == "0") {
    const msg = document.getElementById("errorinput");
    msg.classList.remove("d-none");
    msg.innerText = "Please input Doctor name or select Specialization";
    return;
  }

  if (doctorname.value && specializationvalue.value !== "0") {
    url = `doctors/search?specialization=${specializationvalue.value}&text=${doctorname.value}`;
  } else if (doctorname.value) {
    url = `doctors/search?text=${doctorname.value}`;
  } else {
    url = `doctors/search?specialization=${specializationvalue.value}`;
  }
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("doctors").innerHTML = "";
      document.getElementById("errorinput").classList.add("d-none");
      if (data.length == 0) {
        const msg = document.getElementById("errorinput");
        msg.classList.remove("d-none");
        msg.innerText = "nothing found";
      }
      data.forEach((element) => {
        const doctor = document.createElement("div");
        doctor.className = "col-sm-12 col-lg-4 mb-3";
        doctor.innerHTML = `<div class="card">
      <div class="card-body">
        <h5>${element.full_name}</h5>
        <h6 class="card-subtitle mb-2 text-muted">${element.specialization}</h6>
        <button data-doctorid='${element.id}' class="selecteddoctor card-link btn bg-transparent p-0">Select</button>
      </div>
    </div>`;
        document.getElementById("doctors").appendChild(doctor);
      });

      document.querySelectorAll(".selecteddoctor").forEach((select) => {
        select.addEventListener("click", (event) => {
          doctorId = event.target.dataset.doctorid;
          document
            .querySelectorAll(".selecteddoctor")
            .forEach((notselected) => {
              notselected.innerText = "Select";
            });
          event.target.innerText = "Doctor Selected";
          document
            .getElementById("Appointmentssection")
            .classList.remove("d-none");
        });
      });
    });
});
