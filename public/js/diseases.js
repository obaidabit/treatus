function viewDiseases(data) {
  document.getElementById("diseases").innerHTML = "";

  if (data.length === 0) {
    const doctor = document.createElement("div");
    doctor.className = "col-sm-12";
    doctor.innerHTML = `
            <h5 class="alert alert-warning"> No Medicine found </h5>
        `;
    document.getElementById("diseases").appendChild(doctor);
  }
  data.forEach((element) => {
    const doctor = document.createElement("div");
    doctor.className = "col-sm-12 col-md-4 col-lg-4 mb-3";
    doctor.id = element.id;
    doctor.innerHTML = `
        <div class="card">
          <div class="card-body">
              <h5 class="card-title">${element.name}</h5>
              <a href="/disease_info?name=${element.name}" class="btn btn-main mt-3">
                  More Info
              </a>
          </div>
          </div>
        `;
    document.getElementById("diseases").appendChild(doctor);
  });
}

fetch("publicApi/diseases/latest/")
  .then((res) => res.json())
  .then((data) => {
    viewDiseases(data);
  });

document.getElementById("search-disease").addEventListener("click", () => {
  fetch(
    `publicApi/diseases/search?text=${
      document.getElementById("searchinput").value
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      viewDiseases(data);
    });
});
