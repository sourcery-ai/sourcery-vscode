//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  const chatContainer = document.querySelector(".chatContainer");
  const messageInput = document.querySelector(".message-input");
  let currentAssistantMessage;

  // Function to add a user message to the chat interface
  function addUserMessage(message) {
    let userMessageElement = document.createElement("div");
    userMessageElement.classList.add("user-message");
    userMessageElement.textContent = message;
    chatContainer.append(userMessageElement);
    currentAssistantMessage = null;
  }

  // Function to add an assistant message or add to the existing one
  function addAssistantMessage(message) {
    if (currentAssistantMessage != null) {
      currentAssistantMessage.textContent =
        currentAssistantMessage.textContent + message;
    } else {
      let assistantMessageElement = document.createElement("div");
      assistantMessageElement.classList.add("assistant-message");
      assistantMessageElement.textContent = message;
      chatContainer.append(assistantMessageElement);
      currentAssistantMessage = assistantMessageElement;
    }
  }

  function clearMessages() {
    currentAssistantMessage = null;
    chatContainer.textContent = "";
  }

  messageInput.addEventListener("keypress", (e) => {
    if (e.which === 13) {
      e.preventDefault();
      let message = messageInput.value.trim();
      messageInput.value = "";
      addUserMessage(message);
      sendMessageToExtension(message);
    }
  });

  window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.command === "add_result") {
      addAssistantMessage(message.result);
    } else if (message.command === "clear_chat") {
      clearMessages();
    }
  });

  function sendMessageToExtension(message) {
    vscode.postMessage({ type: "chat_request", data: message });
  }
})();
