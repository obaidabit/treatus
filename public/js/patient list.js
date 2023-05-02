function calculateAge(birthday) {
  var ageDifMs = Date.now() - birthday.getTime();
  var ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function viewpatients(data) {
  document.getElementById("patients").innerHTML = "";
  data.forEach((element) => {
    const patientslist = document.createElement("div");
    patientslist.className = "col-sm-12 col-lg-4 mb-3";
    patientslist.id = element.id;
    patientslist.innerHTML = `<div class="card">
        <div class="card-body">
          <h5 class="card-title">${element.full_name}</h5>
          <h6 class="card-subtitle mb-2 text-muted">
          Gender: ${element.gender} &nbsp; Age: ${calculateAge(
      new Date(element.date)
    )}
          </h6>
          <a href="/patientinfo?patientId=${element.id}"
            class="btn btn-main mt-3"
          >
            View
          </a>
          <button
          data-id="${element.id}"
            class=" click btn btn-danger mt-3"
            type="button"
            id="remove"
          >
            Remove
          </button>
        </div>
      </div>`;
    document.getElementById("patients").appendChild(patientslist);
  });
  document.querySelectorAll(`.click`).forEach((remove) => {
    remove.addEventListener("click", (event) => {
      fetch("doctors/mypatients/removePatient", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          patientId: event.target.dataset.id,
        }),
      })
        .then((res) => res.json())
        .then((remove) => {
          if (remove.affectedRows) {
            document.getElementById(event.target.dataset.id).remove();
            document.getElementById("viewmsg").classList.remove("d-none");
          }
        });
    });
  });
}

fetch("patients/doctor/mypatients/")
  .then((res) => res.json())
  .then((data) => {
    viewpatients(data);
  });
document.getElementById("searchpatient").addEventListener("click", () => {
  fetch(
    `patients/doctor/search?text=${
      document.getElementById("searchinput").value
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      viewpatients(data);
    });
});
