//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  const chatContainer = document.querySelector(
    ".sidebar__chat-assistant--dialogue-container"
  );
  const messageInput = document.getElementById("user-prompt");
  let currentAssistantMessage;

  // Function to add a user message to the chat interface
  function addUserMessageToUI(message) {
    const templateMessage = `
            <div class="sidebar__chat-assistant--chat-bubble-content-user">
              <p class="sidebar__chat-assistant--chat-bubble-text">
                ${message}
              </p>
            </div>
            <div class="sidebar__chat-assistant--chat-avatar-container">
              <span class="sidebar__chat-assistant--agent-avatar-image">🧙🏻‍♂️</span>
            </div>
    `;
    let userMessageElement = document.createElement("li");
    userMessageElement.classList.add("sidebar__chat-assistant--chat-bubble");
    userMessageElement.classList.add(
      "sidebar__chat-assistant--chat-bubble-user"
    );
    userMessageElement.innerHTML = templateMessage;
    chatContainer.append(userMessageElement);
    currentAssistantMessage = null;
  }

  // Function to add an assistant message or add to the existing one
  function addAssistantMessageToUI(message) {
    if (currentAssistantMessage != null) {
      currentAssistantMessage.textContent += message;
    } else {
      const templateContents = `
            <!-- Using an absolute sourcery.ai URL for now, since I'm not sure how does VS Code extensions handle static assets. -->
            <div class="sidebar__chat-assistant--chat-avatar-container">
              <img src="https://sourcery.ai/favicon-32x32.png?v=63c3364394c84cae06d42bc320066118" alt="Sourcery logo"
                class="sidebar__chat-assistant--agent-avatar-image" />
            </div>
            <div class="sidebar__chat-assistant--chat-bubble-content-assistant">
              <p class="sidebar__chat-assistant--chat-bubble-text">
                ${message}
              </p>
            </div>`;

      let assistantMessageElement = document.createElement("li");
      assistantMessageElement.classList.add(
        "sidebar__chat-assistant--chat-bubble"
      );
      assistantMessageElement.classList.add(
        "sidebar__chat-assistant--chat-bubble-agent"
      );
      assistantMessageElement.innerHTML = templateContents;
      chatContainer.append(assistantMessageElement);
      currentAssistantMessage = assistantMessageElement.querySelector(
        ".sidebar__chat-assistant--chat-bubble-text"
      );
    }
  }

  function clearMessages() {
    currentAssistantMessage = null;
    chatContainer.textContent = "";
    checkTextarea();
  }

  messageInput.addEventListener("keypress", (e) => {
    if (e.which === 13 && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  function sendUserMessage() {
    let message = messageInput.value.trim();
    messageInput.value = "";
    addUserMessageToUI(message);
    sendMessageToExtension(message);
    checkTextarea();
  }

  window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.command === "add_result") {
      addAssistantMessageToUI(message.result);
    } else if (message.command === "clear_chat") {
      clearMessages();
    }
  });

  const sendButton = document.getElementById("send-button");

  sendButton.onclick = sendUserMessage;

  // Function to check if the textarea is empty
  function checkTextarea() {
    if (messageInput.value.trim() !== "") {
      sendButton.classList.remove("sidebar__textarea-send-button--disabled");
    } else {
      sendButton.classList.add("sidebar__textarea-send-button--disabled");
    }
  }

  // Add event listener for input changes
  messageInput.addEventListener("input", checkTextarea);

  // Add event listener for backspace key press
  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Backspace") {
      setTimeout(checkTextarea, 0);
    }
  });

  function sendMessageToExtension(message) {
    vscode.postMessage({ type: "chat_request", data: message });
  }
})();
