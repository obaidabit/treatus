function getprofiledoc() {
  fetch("doctors/info")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("full_name").value = data.full_name;
      document.getElementById("doctor_address").value = data.address;
      document.getElementById("doctor_email").value = data.email;
      if (data.image) {
        document.getElementById("doctor_image").src = data.image;
      } else {
        document.getElementById("doctor_image").src =
          "img/depositphotos_137014128-stock-illustration-user-profile-icon.jpg";
      }
    });
}

document.getElementById("imageuoloded").addEventListener("change", (event) => {
  document.getElementById("doctor_image").src = URL.createObjectURL(
    event.target.files[0]
  );
});

document.getElementById("reset").addEventListener("click", () => {
  getprofiledoc();
});
getprofiledoc();
