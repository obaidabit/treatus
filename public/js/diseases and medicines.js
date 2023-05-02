fetch("diseases/patient/mydiseases")
  .then((res) => res.json())
  .then((data) => {
    data.forEach((element) => {
      const newcard = document.createElement("div");
      newcard.className = "col-sm-12 col-md-6 col-lg-4 mb-3";
      newcard.innerHTML = `<div class="card">
        <div class="card-body">
          <h5 class="card-title">${element.name}</h5>
          <a
            class="btn btn-main mt-3"
            target="_blank"
            href="/disease_info?name=${element.name}"
            id="button-addon2"
          >
            View
          </a>
        </div>
      </div>`;
      document.getElementById("diseases").appendChild(newcard);
    });
  });

function showMedicines(data) {
  document.getElementById("medicines").innerHTML = "";
  data.forEach((md) => {
    const mymedicine = document.createElement("div");
    mymedicine.className = "col-sm-12 col-md-6 col-lg-4 mb-3";
    mymedicine.innerHTML = `<div class="card">
        <div class="card-body">
          <h5 class="card-title">${md.name}</h5>
          <h6 class="card-subtitle mb-2 ">
              Potions
          </h6>
          ${md.potions
            .map((p) => {
              return `<h6 class="card-subtitle text-capitalize mb-2 text-muted">
                  ${p.time} - ${p.days} - ${p.pill_number} Pill
              </h6>`;
            })
            .toString()
            .replaceAll(",", " ")}
          <a target="_blank" href="/medicine_info?name=${md.name}"
            class="btn btn-main mt-3"
            type="button"
            id="button-addon2"
          >
            View
          </a>
        </div>
      </div>`;
    document.getElementById("medicines").appendChild(mymedicine);
  });
}

fetch("medicines/patient/mymedicine")
  .then((res) => res.json())
  .then((data) => {
    showMedicines(data);
  });

document.getElementById("searchmed").addEventListener("click", () => {
  fetch(
    `medicines/patient/info/search?text=${
      document.getElementById("Medicinename").value
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      showMedicines(data);
    });
});
