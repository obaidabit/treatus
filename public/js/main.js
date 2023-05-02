if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/serviceworker.js");

  try {
    subscribe();
  } catch (error) {
    console.error(error);
  }
  navigator.serviceWorker.addEventListener("message", function (event) {
    if (event.data && event.data.type === "reload") {
      location.reload();
    }
  });
}

async function subscribe() {
  const readySW = await navigator.serviceWorker.ready;
  const subscription = await readySW.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey:
      "BJaZyJVv5pvGBO-TrYLtn7noICRpoD35XnLP7XcipdpuxCVtirMKl-3eX_65zdCeWIEEajBOV0pTDUg8frjCvLM",
  });
  const result = await fetch("/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription),
  });

  if (!result.ok && result.status !== 403) {
    setTimeout(() => {
      subscribe();
    }, 5000);
  }
}
