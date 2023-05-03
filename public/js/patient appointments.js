fetch("doctors/my_doctors")
  .then((res) => res.json())
  .then((data) => {
    data.forEach((element) => {
      const doctor = document.createElement("option");
      doctor.innerText = element.full_name;
      doctor.value = element.id;
      document.getElementById("doctornames").appendChild(doctor);
    });
  });

document.getElementById("filterappo").addEventListener("click", () => {
  document.getElementById("appointments").innerHTML = "";
  let url = new URLSearchParams();
  url.append("startDate", document.getElementById("inputstartdate").value);
  url.append("endDate", document.getElementById("inputenddate").value);
  url.append("doctorId", document.getElementById("doctornames").value);

  fetch("appointments/search/filter?" + url)
    .then((res) => res.json())
    .then((appo) => {
      appo.forEach((element) => {
        if (element.date && typeof element.date == "string") {
          const dateObj = new Date(element.date);
          date = `${dateObj.getFullYear()}-${
            dateObj.getMonth() + 1
          }-${dateObj.getDate()}`;
        }
        const newappo = document.createElement("div");
        newappo.id = element.id;
        newappo.className = "col-sm-12 col-lg-4 mb-3";
        newappo.innerHTML = `<div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <h5 class="card-title">${element.start_time}</h5>
            <h5 class="card-title">${date}</h5>
          </div>
          <h6 class="card-subtitle mb-2 text-capitalize text-muted">${element.full_name}</h6>
          <button data-appoid="${element.id}" class=" btn p-0 bg-transparent cancelappo card-link text-danger">Cancel</button>
        </div>
      </div>`;
        document.getElementById("appointments").appendChild(newappo);
      });
      document.querySelectorAll(".cancelappo").forEach((click) => {
        click.addEventListener("click", (event) => {
          fetch("appointments/patient/removeAppointment", {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              appointmentId: event.target.dataset.appoid,
            }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.affectedRows) {
                document.getElementById(event.target.dataset.appoid).remove();
              }
            });
        });
      });
    });
});

document.getElementById("reset").addEventListener("click", () => {
  document.getElementById("inputstartdate").value = "";
  document.getElementById("inputenddate").value = "";
  document.getElementById("doctornames").value = "";
});
