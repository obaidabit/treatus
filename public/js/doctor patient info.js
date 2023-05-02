function calculateAge(birthday) {
  var ageDifMs = Date.now() - birthday.getTime();
  var ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function resetPotion() {
  document.getElementById("pillnumber").value = "";
  document.getElementById("pilltime").value = "";
  document.getElementById("Everyday").checked = false;
  document.getElementById("Everyotherday").checked = false;
  document.getElementById("custom").checked = false;
  document.getElementById("customDays").classList.add("d-none");
  document.getElementById("pillchange").innerText = "Add new Potion";
  document
    .querySelectorAll("input[type=checkbox]")
    .forEach((input) => (input.checked = false));
}
let url = new URLSearchParams(location.search);

fetch(`patients/info?patientId=${url.get("patientId")}`)
  .then((res) => res.json())
  .then((patientdata) => {
    document.getElementById("patientname").innerText = patientdata.full_name;
    document.getElementById("age").innerText = calculateAge(
      new Date(patientdata.date)
    );
    document.getElementById("gender").innerText = patientdata.gender;
    document.getElementById("height").innerText = patientdata.height;
    document.getElementById("weight").innerText = patientdata.weight;
    document.getElementById("bloodtype").innerText = patientdata.blood_type;
    document.getElementById("address").innerText = patientdata.address;
    document.getElementById("email").innerText = patientdata.email;
    document.getElementById("phone").innerText = patientdata.phone;
    document.getElementById("image").src = patientdata.image;
  });

function getDiseases(patient_id) {
  document.getElementById("patdiseases").innerHTML = "";
  fetch(`diseases/patient/info?patientId=${patient_id}`)
    .then((res) => res.json())
    .then((diseases) => {
      diseases.forEach((element) => {
        const patdiseases = document.createElement("div");
        patdiseases.dataset.did = element.id;
        patdiseases.innerHTML = `<div class="card">
              <div class="card-body">
                <h5 class="card-title">${element.name}</h5>
  
                <button
                  class="btn btn-danger mt-3 removedis"
                  type="button"
                  data-disid="${element.id}"
                >
                  Remove
                </button>
              </div>
            </div>`;
        patdiseases.className = "col-sm-12 col-lg-4 mb-3";
        document.getElementById("patdiseases").appendChild(patdiseases);
      });
      document.querySelectorAll(".removedis").forEach((remove) => {
        remove.addEventListener("click", (event) => {
          fetch("diseases/removeDisease", {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              patientId: patient_id,
              diseaseId: event.target.dataset.disid,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.affectedRows) {
                document
                  .querySelector(`[data-did="${event.target.dataset.disid}"]`)
                  .remove();
              }
            });
        });
      });
    });
}

document.getElementById("searchdis").addEventListener("click", () => {
  document.getElementById("diseasename").innerHTML = "";
  const diseasesname = document.getElementById("diseasesname").value;
  fetch(`diseases/new/search?text=${diseasesname}`)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((element) => {
        const searchdis = document.createElement("option");
        searchdis.innerText = element.name;
        searchdis.value = element.id;
        document.getElementById("diseasename").appendChild(searchdis);
      });
    });
});

document.getElementById("addDisease").addEventListener("click", () => {
  fetch("diseases/addNewDisease", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      patientId: url.get("patientId"),
      diseaseId: document.getElementById("diseasename").value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.affectedRows) {
        getDiseases(url.get("patientId"));
      }
    });
});

function getMedicines(patient_id) {
  document.getElementById("patmedicines").innerHTML = "";
  fetch(`medicines/patient/info?patientId=${patient_id}`)
    .then((res) => res.json())
    .then((medicines) => {
      medicines.forEach((element) => {
        const patmedicines = document.createElement("div");
        patmedicines.dataset.medid = element.id;
        patmedicines.innerHTML = `<div class="card">
          <div class="card-body">
            <h5 class="card-title">${element.name}</h5>
            <h6 class="card-subtitle mb-2 text-muted">
              ${element.drug_use}
            </h6>
            <button
              class="potionid btn btn-main mt-3"
              type="button" 
              data-medname="${element.name}"
              data-mid="${element.id}"
              data-patientmedicineid=${element.patient_medicine_id}
            >
              Potions
            </button>
            <button
              data-mid="${element.id}"
              class=" removemed btn btn-danger mt-3"
              type="button"
            >
              Remove
            </button>
          </div>
        </div>`;
        patmedicines.className = "col-sm-12 col-lg-4 mb-3";
        document.getElementById("patmedicines").appendChild(patmedicines);
      });
      document.querySelectorAll(".removemed").forEach((remove) => {
        remove.addEventListener("click", (event) => {
          fetch("medicines/removeMedicine", {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              patientId: patient_id,
              medicineId: event.target.dataset.mid,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.affectedRows) {
                document
                  .querySelector(`[data-medid="${event.target.dataset.mid}"]`)
                  .remove();
              }
            });
        });
      });
      document.querySelectorAll(".potionid").forEach((view) => {
        view.addEventListener("click", (event) => {
          resetPotion();
          getPotions(event.target.dataset.mid, event.target.dataset.medname);
          document.getElementById("pillchange").dataset.patientMedicineId =
            event.target.dataset.patientmedicineid;
          document.getElementById("pillchange").dataset.mid =
            event.target.dataset.mid;
          document.getElementById("pillchange").dataset.medname =
            event.target.dataset.medname;
        });
      });
    });
}

function getPotions(mid, medname) {
  document.getElementById("addpotion").classList.remove("d-none");
  document.getElementById("mypotions").innerHTML = "";
  document.getElementById("potionname").innerHTML = `${medname} Potions`;
  fetch(`potions/medicine?patientId=${url.get("patientId")}&medicineId=${mid}`)
    .then((res) => res.json())
    .then((potions) => {
      potions.forEach((potion) => {
        const potionsview = document.createElement("div");
        potionsview.id = potion.id;
        potionsview.className = `col-sm-12 col-lg-12 mb-3`;
        potionsview.innerHTML = `<div class="border rounded p-3">
                  <div class="row">
                    <div
                      class="col-sm-12 col-md-8 col-md-9 d-flex align-items-center"
                    >
                      <h5 class="card-title mb-0 mr-3 font-weight-normal">
                        Time: ${potion.time}
                      </h5>
                      <h5 class="card-title mb-0 mr-3 font-weight-normal">
                        ${potion.pill_number} Pill
                      </h5>
                      <h5 class="text-muted mb-0 font-weight-normal">
                        Days: ${potion.days}
                      </h5>
                    </div>
                    <div
                      class="col-sm-12 col-md-4 col-lg-3 mt-3 mt-lg-0 d-flex align-items-center"
                    >
                      <button
                        class="btn btn-main mr-2 potionchange"
                        type="button"
                        data-potionId="${potion.id}"
                      >
                        Change
                      </button>
                      <button
                        class="btn btn-danger potionremove"
                        type="button"
                        data-potionId="${potion.id}"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>`;
        document.getElementById("mypotions").appendChild(potionsview);
      });

      document.querySelectorAll(".potionremove").forEach((removpot) => {
        removpot.addEventListener("click", (event) => {
          fetch("potions/deletePotion", {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              potionId: event.target.dataset.potionid,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              document.getElementById(event.target.dataset.potionid).remove();
            });
        });
      });
      document.querySelectorAll(".potionchange").forEach((removpot) => {
        removpot.addEventListener("click", (event) => {
          resetPotion();
          fetch(`potions/info?potionId=${event.target.dataset.potionid}`)
            .then((res) => res.json())
            .then((data) => {
              document.getElementById("pillchange").dataset.potionid = data.id;
              document.getElementById("pillchange").dataset.mid = mid;
              document.getElementById("pillchange").dataset.medname = medname;

              document.getElementById("pillnumber").value = data.pill_number;
              document.getElementById("pilltime").value = data.time;
              document.getElementById("pillchange").innerText = "Change Potion";

              if (data.days === "every day") {
                document.getElementById("Everyday").checked = true;
              } else if (data.days === "every other day") {
                document.getElementById("Everyotherday").checked = true;
              } else {
                document.getElementById("custom").checked = true;
                document
                  .getElementById("customDays")
                  .classList.remove("d-none");
                const days = data.days.split(",");
                days.forEach((day) => {
                  if (!day) return;
                  document.getElementById(day.toLowerCase()).checked = true;
                });
              }
            });
        });
      });
    });
}

document.getElementById("searchmid").addEventListener("click", () => {
  fetch(
    `medicines/patient/search?text=${
      document.getElementById("Medicinename").value
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("midselected").innerHTML = "";
      data.forEach((mid) => {
        const midselected = document.createElement("option");
        midselected.innerText = mid.name;
        midselected.value = mid.id;
        document.getElementById("midselected").appendChild(midselected);
      });
    });

  fetch(`diseases/patient/info?patientId=${url.get("patientId")}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("disselected").innerHTML = "";
      data.forEach((dis) => {
        const disselected = document.createElement("option");
        disselected.innerText = dis.name;
        disselected.value = dis.pdid;
        document.getElementById("disselected").appendChild(disselected);
      });
    });
});
document.getElementById("addmid").addEventListener("click", () => {
  fetch("medicines/addNewMedicine", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      medicineId: document.getElementById("midselected").value,
      patientId: url.get("patientId"),
      patientDiseaseId: document.getElementById("disselected").value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.affectedRows) {
        getMedicines(url.get("patientId"));
      }
    });
});

document.getElementById("pillchange").addEventListener("click", (event) => {
  if (
    document.getElementById("pillnumber").value == "" ||
    document.getElementById("pilltime").value == "" ||
    !document.querySelector("input[name='potiondayes']:checked")
  ) {
    return;
  }

  const potionDays = document.querySelector(
    "input[name='potiondayes']:checked"
  );
  let days = "";
  if (potionDays.value === "custom") {
    const checedDays = document.querySelectorAll(
      "#customDays input[name='potiondayes']:checked"
    );
    checedDays.forEach((day) => {
      days += day.value + ",";
    });
  } else {
    days = potionDays.value;
  }

  if (event.target.innerText === "Change Potion") {
    fetch("potions/updatePotion", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        time: document.getElementById("pilltime").value,
        days: days,
        pillNumber: document.getElementById("pillnumber").value,
        potionId: event.target.dataset.potionid,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("pillchange").dataset.potionid = "";
        document.getElementById("pillnumber").value = "";
        document.getElementById("pilltime").value = "";
        document.getElementById("pillchange").innerText = "Add new Potion";
        document
          .querySelectorAll("input[name='potiondayes']:checked")
          .forEach((input) => (input.checked = false));

        getPotions(event.target.dataset.mid, event.target.dataset.medname);
      });
  } else {
    fetch("potions/addNewPotion", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        time: document.getElementById("pilltime").value,
        days: days,
        pillNumber: document.getElementById("pillnumber").value,
        patientId: url.get("patientId"),
        patientMedicineId: event.target.dataset.patientMedicineId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("pillchange").dataset.potionid = "";
        document.getElementById("pillnumber").value = "";
        document.getElementById("pilltime").value = "";
        document.getElementById("pillchange").innerText = "Add new Potion";
        document
          .querySelectorAll("input[name='potiondayes']:checked")
          .forEach((input) => (input.checked = false));

        getPotions(event.target.dataset.mid, event.target.dataset.medname);
      });
  }

  resetPotion();
});

document
  .querySelectorAll("input[name='potiondayes'][type='radio']")
  .forEach((input) => {
    input.addEventListener("change", () => {
      if (input.value == "custom") {
        document.getElementById("customDays").classList.remove("d-none");
      } else {
        document.getElementById("customDays").classList.add("d-none");
        document
          .querySelectorAll("#customDays input[name='potiondayes']:checked")
          .forEach((input) => (input.checked = false));
      }
    });
  });

getDiseases(url.get("patientId"));

getMedicines(url.get("patientId"));

document.getElementById(
  "viewpatientreport"
).href = `/report?patientId=${url.get("patientId")}`;
