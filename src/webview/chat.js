//@ts-check

const assistantAvatar = `<div class="sidebar__chat-assistant--chat-avatar-container">
<img src="https://sourcery.ai/favicon-32x32.png?v=63c3364394c84cae06d42bc320066118" alt="Sourcery logo"
  class="sidebar__chat-assistant--agent-avatar-image" />
</div>`;

const chatAvatar = `<div class="sidebar__chat-assistant--chat-avatar-container">
<span class="sidebar__chat-assistant--agent-avatar-image">🧙🏻‍♂️</span>
</div>`;

const errorAvatar = `<div class="sidebar__chat-assistant--chat-avatar-container" >
    <svg xmlns="http://www.w3.org/2000/svg" height="1.25rem" viewBox="0 0 64 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V320c0 17.7 14.3 32 32 32s32-14.3 32-32V64zM32 480a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>
</div>`;

// This is a little larger than the (empirical) number of pixels the window might scroll by when
// a new line is added. If the line is less than this, we should try to keep scrolling with the window.
// See `stickyScrollToBottom` below.
const LINE_HEIGHT = 36;

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

  const cancelButton = document.getElementById("cancel-button");
  if (cancelButton) {
    cancelButton.onclick = sendCancelRequest;
  }

  const messageContainer = document.getElementById("message-container");

  // Hold the current assistant message so we can direct streaming responses to it
  let currentAssistantMessage;
  let thinkingMessage;

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
      withStickyScroll(addMessageToUI)(message.result);
    } else if (message.command === "clear_chat") {
      clearAllMessages();
    } else if (message.command === "focus") {
      messageInput.focus();
    } else if (message.command === "assistant_finished") {
      assistantMessageFinished();
    }
  });

  function sendRequestToExtension(message) {
    vscode.postMessage({ type: "chat_request", data: message });
  }

  function clearAllMessages() {
    assistantMessageFinished();
    chatContainer.textContent = "";
  }

  function sendCancelRequest() {
    vscode.postMessage({ type: "cancel_request" });
  }

  function sendUserMessage() {
    const message = messageInput.value.trim();
    messageInput.value = "";
    sendRequestToExtension({ message, kind: "user_message" });
    checkTextarea();
  }

  function assistantMessageFinished() {
    currentAssistantMessage = null;
    cancelButton.disabled = true;
  }

  // Function to add a user message to the chat interface
  function addUserMessageToUI(message) {
    const templateMessage = `
            ${chatAvatar}
            <div class="sidebar__chat-assistant--chat-bubble-content-user">
              <p class="sidebar__chat-assistant--chat-bubble-text">${message}</p>
            </div>
    `;
    const userMessageElement = document.createElement("li");
    userMessageElement.classList.add("sidebar__chat-assistant--chat-bubble");
    userMessageElement.classList.add(
      "sidebar__chat-assistant--chat-bubble-user"
    );
    userMessageElement.innerHTML = templateMessage;
    chatContainer.append(userMessageElement);
  }

  function addMessageToUI(result) {
    if (result.role === "assistant") {
      addAssistantMessageToUI(result);
    } else {
      addUserMessageToUI(result.textContent);
      addAssistantThinkingMessageToUI();
    }
  }

  function withStickyScroll(wrapped) {
    return function () {
      const { scrollHeight: scrollHeightBefore } = messageContainer;
      wrapped.apply(this, arguments);
      const { scrollHeight: scrollHeightAfter } = messageContainer;
      stickyScrollToBottom(scrollHeightAfter - scrollHeightBefore);
    };
  }

  // If we're already at the bottom, scroll the bottom into view
  function stickyScrollToBottom(diff = LINE_HEIGHT) {
    const { scrollTop, clientHeight, scrollHeight } = messageContainer;
    const scrollDiff = Math.abs(scrollHeight - clientHeight - scrollTop);
    const isScrolledToBottom = scrollDiff <= diff + 1;

    if (isScrolledToBottom) {
      messageContainer.scrollTop = scrollHeight - clientHeight;
    }
  }

  const setupCopyButton = (block) => {
    if (navigator.clipboard) {
      let text = block.querySelector("code").innerText;
      let button = document.createElement("button");
      button.innerHTML = `
        <svg 
          viewBox="0 0 512 512" 
          xmlns="http://www.w3.org/2000/svg"
          class="sidebar__chat-assistant--code-block-action-button-icon"
        >
          <path d="m272 0h124.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9v220.1c0 26.5-21.5 48-48 48h-192c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48zm-224 128h144v64h-128v256h192v-32h64v48c0 26.5-21.5 48-48 48h-224c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48z" />        
        </svg>
      `;
      button.title = "Copy to Clipboard";
      button.classList.add(
        "sidebar__chat-assistant--chat-bubble-text--code-copy-button"
      );
      block.appendChild(button);
      button.onclick = async () => {
        await navigator.clipboard.writeText(text);
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="sidebar__chat-assistant--code-block-action-button-icon"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
      };
      button.onblur = async () => {
        button.innerHTML = `
          <svg 
            viewBox="0 0 512 512" 
            xmlns="http://www.w3.org/2000/svg"
            class="sidebar__chat-assistant--code-block-action-button-icon"
          >
            <path d="m272 0h124.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9v220.1c0 26.5-21.5 48-48 48h-192c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48zm-224 128h144v64h-128v256h192v-32h64v48c0 26.5-21.5 48-48 48h-224c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48z" />        
          </svg>
        `;
      };
    }
  };

  // Function to add an assistant message or add to the existing one
  function addAssistantMessageToUI(message) {
    cancelButton.disabled = false;
    if (thinkingMessage != null) {
      thinkingMessage.remove();
      thinkingMessage = null;
    }

    const replaceCurrentAssistantMessage = () => {
      currentAssistantMessage.innerHTML = message.textContent;

      let blocks = currentAssistantMessage.querySelectorAll("pre");
      blocks.forEach(setupCopyButton);
    };

    if (currentAssistantMessage != null && message.outcome !== "error") {
      replaceCurrentAssistantMessage();
    } else {
      const templateContents = `
            <!-- Using an absolute sourcery.ai URL for now, since I'm not sure how does VS Code extensions handle static assets. -->
            ${message.outcome === "error" ? errorAvatar : assistantAvatar}
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

      if (message.outcome === "error") {
        assistantMessageElement.classList.add(
          "sidebar__chat-assistant--chat-bubble-error"
        );
      }
      assistantMessageElement.innerHTML = templateContents;
      chatContainer.append(assistantMessageElement);
      currentAssistantMessage = assistantMessageElement.querySelector(
        ".sidebar__chat-assistant--chat-bubble-text"
      );
      replaceCurrentAssistantMessage();
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
    adjustTextareaHeight(messageInput);
  }

  // Check for disable/enable send button and sizing
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

  const adjustTextareaHeight = (textarea) => {
    // Reset height to auto to get the actual scroll height, and set it to that value
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";

    // Check if scrolling occurs after setting the new height
    if (textarea.clientHeight < textarea.scrollHeight) {
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };
})();
