function displayResults(result) {
  document.getElementById("indications_and_usage").innerText =
    result.indications_and_usage || "No Information";

  document.getElementById("description").innerText =
    result.description || "No Information";

  document.getElementById("dosage_and_administration").innerHTML =
    result.dosage_and_administration_table ||
    result.dosage_and_administration ||
    "No Information";

  document.getElementById("instructions_for_use").innerHTML =
    result.instructions_for_use_table ||
    result.instructions_for_use ||
    "No Information";

  document.getElementById("contraindications").innerText =
    result.contraindications || "No Information";

  document.getElementById("drug_interactions_table").innerHTML =
    result.drug_interactions_table ||
    result.drug_interactions ||
    "No Information";

  document.getElementById("dosage_forms_and_strengths").innerText =
    result.dosage_forms_and_strengths || "No Information";

  document.getElementById("warnings_and_cautions").innerText =
    result.warnings_and_cautions || "No Information";

  document.getElementById("adverse_reactions").innerHTML =
    result.adverse_reactions_table ||
    result.adverse_reactions ||
    "No Information";

  document.getElementById("pregnancy").innerText =
    result.pregnancy || "No Information";

  document.getElementById("pediatric_use").innerText =
    result.pediatric_use || "No Information";

  document.getElementById("geriatric_use").innerText =
    result.geriatric_use || "No Information";

  document
    .querySelectorAll("table")
    .forEach(
      (table) =>
        (table.className = "table table-striped bg-white table-bordered")
    );
}

async function searchMedicine(query) {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${query}"&limit=1`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      displayResults(data.results[0]);
    } else {
      throw new Error("Unable to fetch data");
    }
  } catch (error) {
    displayResults({});
    console.error(error);
  }
}

const murl = new URL(location.href);
const medicineName = murl.searchParams.get("name");
document.getElementById("medicine_name").innerText = medicineName;
searchMedicine(medicineName);
