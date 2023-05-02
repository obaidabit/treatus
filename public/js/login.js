document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  fetch("auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: document.getElementById("InputEmail1").value,
      password: document.getElementById("InputPassword").value,
      accounttype: document.querySelector("input[name='accounttype']:checked")
        ?.value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.id) {
        location.href = "/home";
      } else {
        document.getElementById("wrongMsg").innerText = data.msg;
        document.getElementById("wrongMsg").classList.remove("d-none");
      }
    });
});
