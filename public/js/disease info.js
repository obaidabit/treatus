function displayResults(page) {
  const row = document.getElementById("disease_info");

  if (!page) {
    const p = document.createElement("p");
    p.innerText = "No Information";
    row.appendChild(p);
    return;
  }
  const content = page?.content;

  content.forEach((element) => {
    if (
      element.title === "External links" ||
      element.title === "References" ||
      element.title === "See also"
    )
      return;
    const h5 = document.createElement("h5");
    h5.innerText = element.title;

    const p = document.createElement("p");
    p.innerText = element.content || "No Information";

    row.appendChild(h5);
    row.appendChild(p);
  });
}
async function searchMedicine(query) {
  try {
    const response = await fetch(
      `/publicApi/diseases/search/info?text=${query}`
    );

    if (response.ok) {
      const data = await response.json();
      displayResults(data);
    } else {
      throw new Error("Unable to fetch data");
    }
  } catch (error) {
    displayResults(undefined);
    console.error(error);
  }
}

const durl = new URL(location.href);
const diseaseName = durl.searchParams.get("name");
document.getElementById("disease_name").innerText = diseaseName;
searchMedicine(diseaseName);
