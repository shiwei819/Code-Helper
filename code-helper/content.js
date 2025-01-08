// Global variables to track the floating button, popup, and selected text
let floatButton = null;
let currentSelectedText = "";
let popupWindow = null;

// Listen for text selection
document.addEventListener("mouseup", handleTextSelection);

function handleTextSelection(event) {
  if (
    event.target.classList.contains("code-helper-button") ||
    event.target.closest(".popup-window")
  ) {
    return;
  }

  const selectedText = window.getSelection().toString().trim();

  if (selectedText && selectedText !== currentSelectedText) {
    currentSelectedText = selectedText;
    const selectionRange = window.getSelection().getRangeAt(0).getBoundingClientRect();
    createFloatingButton(selectedText, selectionRange, event);
  } else if (!selectedText) {
    currentSelectedText = "";
    removeFloatingButton();
  }
}

// control float button
function createFloatingButton(selectedText, selectionRange, event) {
  if (floatButton) {
    floatButton.style.top = `${event.pageY}px`;
    floatButton.style.left = `${event.pageX}px`;
    return;
  }

  floatButton = document.createElement("button");
  floatButton.textContent = "Explain";
  floatButton.style.position = "absolute";
  floatButton.style.top = `${event.pageY}px`;
  floatButton.style.left = `${event.pageX}px`;
  floatButton.style.zIndex = 1000;
  floatButton.className = "code-helper-button";

  floatButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openPopupWindow(selectedText);
  });

  document.body.appendChild(floatButton);
}

function removeFloatingButton() {
  if (floatButton) {
    floatButton.remove();
    floatButton = null;
  }
}

// control pop-up window
function openPopupWindow(selectedText) {
  removeFloatingButton();

  popupWindow = document.createElement("div");
  popupWindow.className = "popup-window";
  popupWindow.innerHTML = `
    <div class="popup-header">
      <h3>Code Explanation</h3>
      <button class="popup-close" aria-label="Close popup">&times;</button>
    </div>
    <div class="popup-body">
      <p class="popup-description">
        <strong>Selected Text:</strong> <span>${selectedText}</span>
      </p>
      <div class="popup-content">
        <p>Fetching explanation...</p>
        <div class="loading-spinner"></div>
      </div>
    </div>
    <div class="popup-interact">
      <input type="text" id="followup-question" placeholder="Ask further explanation..." />
      <div class="upload-container">
        <label for="upload-file" class="icon-button">
          <img src="https://files.softicons.com/download/toolbar-icons/glyphish-icons-by-joseph-wain/png/32x32/68-paperclip.png" id="upload-icon" />
          <span id="file-status" class="tooltip">No file selected</span>
        </label>
        <input type="file" id="upload-file" accept=".txt,.py,.js,.java,.cpp,.c,.pdf,.ipynb,.docx,.html"/>
      </div>
      <button id="input-submit" aria-label="Submit input" disabled>&crarr;</button>
    </div>
    
  `;

  const inputField = popupWindow.querySelector("#followup-question");
  const fileInput = popupWindow.querySelector("#upload-file");
  const fileStatus = popupWindow.querySelector("#file-status")
  const submitButton = popupWindow.querySelector("#input-submit");

  popupWindow.querySelector(".popup-close").addEventListener("click", () => {
    popupWindow.remove();
    popupWindow = null;
  });

  // disable submitbutton when no input AND no file selected
  inputField.addEventListener("input", () => {
    submitButton.disabled = !(inputField.value.trim() || fileInput.files.length);
  });

  fileInput.addEventListener("change", () => {
    submitButton.disabled = !(inputField.value.trim() || fileInput.files.length);
  });

  // Show file selection status when a file is selected or not
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0]; // Get the selected file

    fileStatus.classList.remove('file-selected');
    fileStatus.classList.remove('file-exceeds-size');

    if (file) {
      if (file.size > 1048576){
        fileStatus.textContent = `File size exceeds 1MB`;
        // fileInput.value = "";
        fileStatus.classList.add('file-exceeds-size');
        submitButton.disabled = true;
      } else {
        fileStatus.textContent = `Selected: ${file.name}`;
        fileStatus.classList.add('file-selected'); // Optional: Change tooltip style
      }
    } else {
      fileStatus.textContent = 'No file selected';
    }
  });

  inputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && (inputField.value.trim() || fileInput.files.length)) {
      const question = inputField.value.trim();
      fetchFollowupQuestion(question, popupWindow.querySelector(".popup-content"));
    }
  });

  submitButton.addEventListener("click", ()=>{
    const question = inputField.value.trim();
    fetchFollowupQuestion(question, popupWindow.querySelector(".popup-content"));
  });

  document.body.appendChild(popupWindow);
  popupWindow.style.position = "fixed";
  popupWindow.style.top = "100px";
  popupWindow.style.left = "100px";


  makePopupDraggable(popupWindow);
  fetchCodeExplanation(selectedText, popupWindow.querySelector(".popup-content"));
}

// handle file upload
// repeat to check the file size again here
function handleFileUpload(fileInput, callback) {
  const file = fileInput.files[0]; // Get the first selected file
  const fileStatus = document.querySelector("#file-status")

  if (file) {
    // Check file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      // alert("File size exceeds 1MB. Please upload a smaller file.");
      fileInput.value = ""; // Clear the file input field
      fileStatus.classList.remove('file-exceeds-size'); // Clear the fileStatus
      fileStatus.textContent = 'No file selected';
      callback(null); // Treat as No file selected
    } else {
      // If the file size is valid, read its content
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(event.target.result); // Pass the file content to the callback
      };
      reader.readAsText(file);

      fileStatus.classList.remove('file-selected'); // Clear the fileStatus
      fileStatus.textContent = 'No file selected';
    }

  } else {
    callback(null); // No file selected
  }
}

// interacat with API
async function fetchCodeExplanation(code, popupContent) {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/explanation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    // console.log(data.explanation); //debug
    if (data.explanation) {
      popupContent.innerHTML = `
        <p><strong>Explanation:</strong></p>
        <pre class="code-block">${data.explanation}</pre>
      `;
    } else {
      popupContent.innerHTML = `<p class="error-message">Error: ${data.error || "Unable to fetch explanation"}</p>`;  //error-message class is not exist in style
    }
  } catch (error) {
    popupContent.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
  }
}

// ask followup question
async function fetchFollowupQuestion(question, popupContent) {
  try {
    // Clear the input field after submission
    const inputField = document.querySelector("#followup-question");
    const fileInput = document.querySelector("#upload-file");
    if(inputField) inputField.value = "";


    // Add loading spinner
    popupContent.innerHTML += `<p class="question"><strong>Followup-Question: </strong><span>${question}</span></p><div class="loading-spinner"></div>`; // Add loading spinner
    
    // Read file content if a file is uploaded
    handleFileUpload(fileInput, async (fileContent) => {
      const response = await fetch("http://127.0.0.1:5000/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, fileContent }),
      });

      const data = await response.json();
      const loadingSpinner = popupContent.querySelector(".loading-spinner");
      if (loadingSpinner) loadingSpinner.remove();

      // style should be changed here
      if (data.answer) {
        popupContent.innerHTML += `<p><strong>Answer:</strong></p> <pre class="code-block">${data.answer}</pre>`;
      } else {
        popupContent.innerHTML += `<p class="error-message">Error: ${data.error || "Unable to fetch the answer."}</p>`;
      } 
    });

  } catch (error) {
    popupContent.innerHTML += `<p class="error-message">Error: ${error.message}</p>`;
  }
}

// pop-up window dragging 
function makePopupDraggable(popup) {
  const header = popup.querySelector(".popup-header");
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.style.cursor = "move";

  header.addEventListener("mousedown", (event) => {
    isDragging = true;
    offsetX = event.clientX - popup.offsetLeft;
    offsetY = event.clientY - popup.offsetTop;
    popup.style.position = "fixed";
    popup.style.zIndex = 1000;
  });

  document.addEventListener("mousemove", (event) => {
    if (isDragging) {
      popup.style.left = `${event.clientX - offsetX}px`;
      popup.style.top = `${event.clientY - offsetY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}