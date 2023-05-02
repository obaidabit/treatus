fetch("appointments/today")
  .then((res) => res.json())
  .then((data) => {
    data.forEach((element) => {
      const doctodayapp = document.createElement("div");
      doctodayapp.className = "col-sm-12 col-lg-4 mb-3";
      doctodayapp.id = element.id;
      doctodayapp.innerHTML = `<div class="card">
      <div class="card-body">
        <h5 class="card-title">${element.start_time}</h5>
        <h6 class="card-subtitle mb-2 text-muted">${element.full_name}</h6>
        <a href="/viewAppointment?appid=${element.id}" class="card-link text-main">View</a>
        <button data-appoid="${element.id}" class="cancappo btn p-0 bg-transparent card-link text-danger">Cancel</button>
      </div>
    </div>`;
      document.getElementById("appo").appendChild(doctodayapp);
    });
    const canselappo = document.querySelectorAll(".cancappo");
    canselappo.forEach((click) => {
      click.addEventListener("click", (event) => {
        fetch("appointments/doctor/removeAppointment", {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            appointmentId: event.target.dataset.appoid,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.affectedRows) {
              document.getElementById(event.target.dataset.appoid).remove();
            }
          });
      });
    });
  });
