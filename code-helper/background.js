chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === "fetchExplanation") {
    console.log("Fetching explanation for:", request.code);
    fetch("http://127.0.0.1:5000/api/explanation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: request.code })
    })
      .then(response => response.json())
      .then(data => {
        console.log("Explanation fetched:", data);
        sendResponse({ explanation: data.explanation });
      })
      .catch(error => {
        console.error("Error fetching explanation:", error);
        sendResponse({ explanation: "Error fetching explanation." });
      });
    return true;
  }
});


// This is where to control the page we want to listen