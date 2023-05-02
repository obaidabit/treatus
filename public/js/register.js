document.querySelectorAll("input[name='accounttype']").forEach((input) => {
  input.addEventListener("change", () => {
    if (input.value == "doctor") {
      document.getElementById("Specialization").classList.remove("d-none");
    } else {
      document.getElementById("Specialization").classList.add("d-none");
    }
  });
});

document.getElementById("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  fetch("auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullname: document.getElementById("inputfullname").value,
      date: document.getElementById("birthdate").value,
      accounttype: document.querySelector("input[name='accounttype']:checked")
        ?.value,
      gender: document.querySelector("input[name='radiogender']:checked")
        ?.value,
      email: document.getElementById("InputEmail1").value,
      password: document.getElementById("InputPassword").value,
      specialization: document.getElementById("inputspecialization").value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.id) {
        location.href = "/login";
      } else {
        document.getElementById("wrongMsg").innerText = data.msg;
        document.getElementById("wrongMsg").classList.remove("d-none");
      }
    });
});
