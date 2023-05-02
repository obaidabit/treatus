document.getElementById("logoutbutton").addEventListener("click", (event) => {
  fetch("auth/logout", {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.msg) {
        location.href = "/login";
      }
    });
});

fetch("user")
  .then((res) => res.json())
  .then((res) => {
    if (res.type == "doctor") {
      document.getElementById("username").innerText = `Dr.` + res.full_name;
    } else {
      document.getElementById("username").innerText = res.full_name;
    }
  })
  .catch((err) => {
    document.querySelector(".ml-auto.order-lg-2").classList.add("d-none");
  });

document.getElementById("username").classList.add("text-capitalize");
