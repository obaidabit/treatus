fetch("potions/todayPotions")
  .then((res) => res.json())
  .then((potions) => {
    if (potions.length == 0) {
      const nopotions = document.createElement("h6");
      nopotions.innerText = "No Potions for today";
      nopotions.classList.add("text-danger");
      nopotions.classList.add("col-12");
      document.getElementById("potions").appendChild(nopotions);
    }
    potions.forEach((po) => {
      const potion = document.createElement("div");
      potion.className = "col-sm-12 col-lg-4 mb-3";
      potion.dataset.potionid = po.id;
      potion.innerHTML = `<div class="card">
      <div class="card-body">
        <h5 class="card-title mb-2">${po.name}</h5>
        <div class="d-flex align-items-center">
          <h6 class="card-subtitle text-muted mr-2 mb-0">${po.time}</h6>
          <h6 class="card-subtitle text-muted mb-0">${po.pill_number} pills</h6>
        </div>
        <button
          class="take btn bg-transparent p-0 card-link text-main mt-2"
          data-potionId='${po.id}'
        >
          Take Medicine
        </button>
      </div>
    </div>`;
      document.getElementById("potions").appendChild(potion);
    });
    document.querySelectorAll(".take").forEach((element) =>
      element.addEventListener("click", (event) => {
        fetch("potion_logs/takePotion", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            potionId: event.target.dataset.potionid,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.affectedRows) {
              document
                .querySelector(
                  `div[data-potionid='${event.target.dataset.potionid}']`
                )
                .remove();
              if (document.getElementById("potions").children.length == 0) {
                const nopotions = document.createElement("h6");
                nopotions.innerText = "No Potions for today";
                nopotions.classList.add("text-danger");
                nopotions.classList.add("col-12");
                document.getElementById("potions").appendChild(nopotions);
              }
            }
          });
      })
    );
  });

fetch("appointments/patient/weekappointments")
  .then((res) => res.json())
  .then((data) => {
    if (data.length == 0) {
      const noapp = document.createElement("h6");
      noapp.innerText = "No Appointments for this Week";
      noapp.classList.add("alert-warning");
      noapp.classList.add("col-12");
      noapp.classList.add("alert");
      document.getElementById("appointments").appendChild(noapp);
    }
    data.forEach((app) => {
      const App = document.createElement("div");
      App.className = "col-sm-12 col-lg-4 mb-3";
      App.dataset.id = app.id;
      App.innerHTML = `<div class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <h5 class="card-title">${app.start_time}</h5>
          <h5 class="card-title">${app.date}</h5>
        </div>
        <h6 class="card-subtitle mb-2 text-muted">${app.full_name}</h6>
        <button class="btn card-link cancel text-danger bg-transparent p-0 " data-appointmentid='${app.id}' >Cancel</button>
      </div>
    </div>`;
      document.getElementById("appointments").appendChild(App);
    });
    document.querySelectorAll(".cancel").forEach((element) => {
      element.addEventListener("click", (event) => {
        fetch("appointments/patient/removeAppointment", {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            appointmentId: event.target.dataset.appointmentid,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.affectedRows) {
              document
                .querySelector(
                  `div[data-id='${event.target.dataset.appointmentid}']`
                )
                .remove();
              if (
                document.getElementById("appointments").children.length == 0
              ) {
                const noapp = document.createElement("h6");
                noapp.innerText = "No Appointments for this Week";
                noapp.classList.add("alert-warning");
                noapp.classList.add("col-12");
                noapp.classList.add("alert");
                document.getElementById("appointments").appendChild(noapp);
              }
            }
          });
      });
    });
  });
