function calculateAge(birthday) {
  var ageDifMs = Date.now() - birthday.getTime();
  var ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

let isSearch = false;

function getLatest() {
  isSearch = false;
  fetch("patients/latest")
    .then((res) => res.json())
    .then((data) => {
      showPatients(data);
    });
}

function getSearch() {
  isSearch = true;
  fetch(
    `patients/allpatients/search?text=${
      document.getElementById("patsearch").value
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      showPatients(data);
    });
}

function addListeners() {
  document.querySelectorAll(".add").forEach((click) => {
    click.addEventListener("click", (event) => {
      fetch("doctors/mypatients/addNewPatient", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          patientId: event.target.dataset.patientid,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.affectedRows) {
            event.target.innerText = "Remove";
            event.target.classList.remove("btn-main");
            event.target.classList.add("btn-danger");
            if (isSearch) {
              getSearch();
            } else {
              getLatest();
            }
            document.getElementById("msg").classList.remove("d-none");
            document.getElementById("msg").classList.remove("alert-warning");
            document.getElementById("msg").classList.add("alert-success");
            document.getElementById("msg").innerText =
              "Patient Rami has been added to your patient list";
          }
        });
    });
  });
}

function removeListeners() {
  document.querySelectorAll(".remove").forEach((click) => {
    click.addEventListener("click", (event) => {
      fetch("doctors/mypatients/removePatient", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          patientId: event.target.dataset.patientid,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.affectedRows) {
            event.target.innerText = "Add";
            event.target.classList.add("btn-main");
            event.target.classList.remove("btn-danger");
            if (isSearch) {
              getSearch();
            } else {
              getLatest();
            }
            document.getElementById("msg").classList.remove("d-none");
            document.getElementById("msg").classList.remove("alert-success");
            document.getElementById("msg").classList.add("alert-warning");
            document.getElementById("msg").innerText =
              "Patient Rami has been removed from your patient list";
          }
        });
    });
  });
}

function showPatients(data) {
  console.log("new");
  document.getElementById("patlat").innerHTML = "";
  data.forEach((element) => {
    const latestpat = document.createElement("div");
    latestpat.className = `col-sm-12 col-lg-4 mb-3`;
    latestpat.innerHTML = `<div class="card">
          <div class="card-body">
            <h5 class="card-title">${element.full_name}</h5>
            <h6 class="card-subtitle mb-2 text-muted">
             Gender: ${element.gender} &nbsp; Age: ${calculateAge(
      new Date(element.date)
    )}
            </h6>
            ${
              element.is_my_patient == "true"
                ? `<button
                class="remove btn btn-danger mt-3"
                type="button"    data-patientId="${element.id}"    
              >
                Remove
              </button>`
                : `<button
          class=" add btn btn-main mt-3"
          data-patientId="${element.id}" type="button"    
        >
          Add
        </button>`
            }
          </div>
        </div>`;
    document.getElementById("patlat").appendChild(latestpat);
  });
  addListeners();
  removeListeners();
}

getLatest();
document.getElementById("search").addEventListener("click", () => {
  if (document.getElementById("patsearch").value == "") {
    getLatest();
  } else {
    getSearch();
  }
});
