function getprofilepat() {
  fetch("patients/info/my")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("full_name").value = data.full_name;
      document.getElementById("patient_address").value = data.address;
      document.getElementById("patient_Phone").value = data.phone;
      document.getElementById("patient_Height").value = data.height;
      document.getElementById("patient_Weight").value = data.weight;
      document.getElementById("patient_blood").value = data.blood_type;
      document.getElementById("patient_email").value = data.email;

      if (data.image) {
        document.getElementById("patient_image").src = data.image;
      } else {
        document.getElementById("patient_image").src =
          "img/depositphotos_137014128-stock-illustration-user-profile-icon.jpg";
      }
    });
}

document.getElementById("imageuoloded").addEventListener("change", (event) => {
  document.getElementById("patient_image").src = URL.createObjectURL(
    event.target.files[0]
  );
});

document.getElementById("reset").addEventListener("click", () => {
  getprofilepat();
});
getprofilepat();
