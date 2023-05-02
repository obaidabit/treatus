function viewMedicines(data) {
  document.getElementById("medicines").innerHTML = "";

  if (data.length === 0) {
    const doctor = document.createElement("div");
    doctor.className = "col-sm-12";
    doctor.innerHTML = `
          <h5 class="alert alert-warning"> No Medicine found </h5>
      `;
    document.getElementById("medicines").appendChild(doctor);
  }
  data.forEach((element) => {
    const doctor = document.createElement("div");
    doctor.className = "col-sm-12 col-md-4 col-lg-4 mb-3";
    doctor.id = element.id;
    doctor.innerHTML = `
      <div class="card">
        <div class="card-body">
            <h5 class="card-title">${element.name}</h5>
            <h6 class="card-subtitle mb-2 text-muted">
                ${element.drug_use}
            </h6>
            <a href="/medicine_info?name=${element.name}" class="btn btn-main mt-3">
                More Info
            </a>
        </div>
        </div>
      `;
    document.getElementById("medicines").appendChild(doctor);
  });
}

fetch("publicApi/medicines/latest/")
  .then((res) => res.json())
  .then((data) => {
    viewMedicines(data);
  });

document.getElementById("search-medicine").addEventListener("click", () => {
  fetch(
    `publicApi/medicines/search?text=${
      document.getElementById("searchinput").value
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      viewMedicines(data);
    });
});
