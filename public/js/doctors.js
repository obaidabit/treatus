function calculateAge(birthday) {
  var ageDifMs = Date.now() - birthday.getTime();
  var ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function viewDoctors(data) {
  document.getElementById("doctors").innerHTML = "";

  if (data.length === 0) {
    const doctor = document.createElement("div");
    doctor.className = "col-sm-12";
    doctor.innerHTML = `
        <h5 class="alert alert-warning"> No Doctors found </h5>
    `;
    document.getElementById("doctors").appendChild(doctor);
  }
  data.forEach((element) => {
    const doctor = document.createElement("div");
    doctor.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-3";
    doctor.id = element.id;
    doctor.innerHTML = `
    <div class="card">
        <div class="card-body text-center text-md-left">
            <img
                src="${
                  element.image
                    ? element.image
                    : "img/depositphotos_137014128-stock-illustration-user-profile-icon.jpg"
                }"
                alt="profile image"
                class="mb-3 rounded-circle"
                style="width: 90px; height: 90px; object-fit: cover"
            />
            <h5 class="card-title mb-3 text-capitalize">${
              element.full_name
            }</h5>
            <h6 class="card-subtitle mb-2">
                Specialization:
            </h6>
            <h6 class="card-subtitle mb-3 text-muted text-capitalize">
                ${element.specialization}
            </h6>
            <h6 class="card-subtitle mb-2">Gender:</h6>
            <h6 class="card-subtitle mb-3 text-muted text-capitalize">${
              element.gender
            }</h6>
            <h6 class="card-subtitle mb-2">Age:</h6>
            <h6 class="card-subtitle mb-2 text-muted">${calculateAge(
              new Date(element.date)
            )} Years old</h6>
        </div>
    </div>`;
    document.getElementById("doctors").appendChild(doctor);
  });
}

fetch("publicApi/doctors/latest/")
  .then((res) => res.json())
  .then((data) => {
    viewDoctors(data);
  });

fetch("publicApi/doctors/specialization/all")
  .then((res) => res.json())
  .then((data) => {
    data.forEach((speci) => {
      const option = document.createElement("option");
      option.value = speci.specialization;
      option.innerText = speci.specialization;
      document.getElementById("specialization").appendChild(option);
    });
  });
document.getElementById("search-doctor").addEventListener("click", () => {
  fetch(
    `publicApi/doctors/search?text=${
      document.getElementById("searchinput").value
    }&specialization=${document.getElementById("specialization").value}`
  )
    .then((res) => res.json())
    .then((data) => {
      viewDoctors(data);
    });
});
