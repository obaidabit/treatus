function viewappointments(data) {
  data.forEach((element) => {
    let date = "";
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
          <h6 class="card-subtitle mb-2 text-muted">${element.full_name}</h6>
          <a href="/viewAppointment?appid=${element.id}" class="card-link text-main">View</a>
          <button data-appoid="${element.id}" class=" cancelappo btn p-0 bg-transparent card-link text-danger">Cancel</button>
        </div>
      </div>`;
    document.getElementById("appo").appendChild(newappo);
  });
  document.querySelectorAll(".cancelappo").forEach((click) => {
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
        .then((result) => {
          if (result.affectedRows) {
            document.getElementById(event.target.dataset.appoid).remove();
          }
        });
    });
  });
}

fetch("appointments/today")
  .then((res) => res.json())
  .then((data) => {
    viewappointments(data);
  });

document.getElementById("searchpat").addEventListener("click", () => {
  document.getElementById("patientname").innerHTML = "";
  const patientname = document.getElementById("inputpatientname").value;
  fetch(`patients/doctor/search?text=${patientname}`)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((element) => {
        const searchpat = document.createElement("option");
        searchpat.innerText = element.full_name;
        searchpat.value = element.id;
        document.getElementById("patientname").appendChild(searchpat);
      });
    });
});

document.getElementById("filterappo").addEventListener("click", () => {
  document.getElementById("appo").innerHTML = "";
  let url = new URLSearchParams();
  url.append("startDate", document.getElementById("inputstartdate").value);
  url.append("endDate", document.getElementById("inputenddate").value);
  url.append("patientId", document.getElementById("patientname").value);

  fetch("appointments/search/filter?" + url)
    .then((res) => res.json())
    .then((appo) => {
      viewappointments(appo);
    });
});

document.getElementById("reset").addEventListener("click", () => {
  document.getElementById("inputpatientname").value = "";
  document.getElementById("inputstartdate").value = "";
  document.getElementById("inputenddate").value = "";
  document.getElementById("patientname").innerHTML = "";
});
