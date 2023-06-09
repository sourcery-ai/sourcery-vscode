//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  const chatContainer = document.querySelector(
    ".sidebar__chat-assistant--dialogue-container"
  );
  const messageInput = document.getElementById("user-prompt");
  messageInput.focus();

  const sendButton = document.getElementById("send-button");
  sendButton.onclick = sendUserMessage;

  // Hold the current assistant message so we can direct streaming responses to it
  let currentAssistantMessage;
  let thinkingMessage;

  const assistantAvatar = `<div class="sidebar__chat-assistant--chat-avatar-container">
              <img src="https://sourcery.ai/favicon-32x32.png?v=63c3364394c84cae06d42bc320066118" alt="Sourcery logo"
                class="sidebar__chat-assistant--agent-avatar-image" />
            </div>`;

  function createThinkingMessage() {
    const templateContents = `
            <!-- Using an absolute sourcery.ai URL for now, since I'm not sure how does VS Code extensions handle static assets. -->
            ${assistantAvatar}
            <div class="sidebar__chat-assistant--chat-bubble-content-assistant">
              <span class="sidebar__chat-assistant--agent-typing-dot"></span>
              <span class="sidebar__chat-assistant--agent-typing-dot"></span>
              <span class="sidebar__chat-assistant--agent-typing-dot"></span>
            </div>`;
    const result = document.createElement("li");
    result.classList.add("sidebar__chat-assistant--chat-bubble");
    result.classList.add("sidebar__chat-assistant--chat-bubble-agent");
    result.innerHTML = templateContents;
    return result;
  }

  const thinkingMessageElement = createThinkingMessage();

  // Communication between the webview and the extension proper
  window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.command === "add_result") {
      addAssistantMessageToUI(message.result);
    } else if (message.command === "clear_chat") {
      clearAllMessages();
    } else if (message.command === "focus") {
      messageInput.focus();
    }
  });
  function sendMessageToExtension(message) {
    vscode.postMessage({ type: "chat_request", data: message });
  }

  function clearAllMessages() {
    currentAssistantMessage = null;
    chatContainer.textContent = "";
  }

  function sendUserMessage() {
    const message = messageInput.value.trim();
    messageInput.value = "";
    addUserMessageToUI(message);
    addAssistantThinkingMessageToUI();
    sendMessageToExtension(message);
    checkTextarea();
  }

  // Function to add a user message to the chat interface
  function addUserMessageToUI(message) {
    const templateMessage = `
            <div class="sidebar__chat-assistant--chat-bubble-content-user">
              <p class="sidebar__chat-assistant--chat-bubble-text">${message}</p>
            </div>
            <div class="sidebar__chat-assistant--chat-avatar-container">
              <span class="sidebar__chat-assistant--agent-avatar-image">🧙🏻‍♂️</span>
            </div>
    `;
    const userMessageElement = document.createElement("li");
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
    if (thinkingMessage != null) {
      thinkingMessage.remove();
      thinkingMessage = null;
    }

    const addMessageToCurrentAssistantMessage = () => {
      let assistantMessageSpan = document.createElement("span");
      assistantMessageSpan.textContent = message.textContent;
      if (message.outcome === "error") {
        assistantMessageSpan.style.color = "red";
      }
      currentAssistantMessage.append(assistantMessageSpan);
    };

    if (currentAssistantMessage != null) {
      addMessageToCurrentAssistantMessage();
    } else {
      const templateContents = `
            <!-- Using an absolute sourcery.ai URL for now, since I'm not sure how does VS Code extensions handle static assets. -->
            ${assistantAvatar}
            <div class="sidebar__chat-assistant--chat-bubble-content-assistant">
              <p class="sidebar__chat-assistant--chat-bubble-text"></p>
            </div>`;

      const assistantMessageElement = document.createElement("li");
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
      addMessageToCurrentAssistantMessage();
    }
  }

  function addAssistantThinkingMessageToUI() {
    if (thinkingMessage != null) {
      thinkingMessage.remove();
      thinkingMessage = null;
    }
    thinkingMessage = thinkingMessageElement;
    chatContainer.append(thinkingMessage);
  }

  // Enable/Disable send button depending on whether text area is empty
  function checkTextarea() {
    if (messageInput.value.trim() !== "") {
      sendButton.classList.remove("sidebar__textarea-send-button--disabled");
    } else {
      sendButton.classList.add("sidebar__textarea-send-button--disabled");
    }
  }

  // Check for disable/enable send button
  messageInput.addEventListener("input", checkTextarea);

  // Check to see if we need to disable send button on backspace
  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Backspace") {
      setTimeout(checkTextarea, 0);
    }
  });

  // Listen for return key in order to send user messages
  messageInput.addEventListener("keypress", (e) => {
    if (e.which === 13 && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });
})();
