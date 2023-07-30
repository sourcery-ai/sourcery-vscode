//@ts-check

// This is the sourcery logo
const assistantAvatar = `<div class="sidebar__chat-assistant--chat-avatar-container">
  <svg viewBox="0 0 1037.1 1037.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">  
    <polygon fill="#FFFFFF" points="527.2 74.6 100.9 304.3 100.9 513.7 100.9 656.7 100.9 733.3 518.3 963.1 935.7 733.3 935.7 646.5 935.7 513.7 935.7 294.1"/>
    <polygon fill="#31313A" points="100.9 656.7 527.2 426.9 935.7 646.5 935.7 733.3 518.3 963.1 100.9 733.3"/>
    <polygon fill="#F7931E" fill-opacity="0.8" points="518.3 521 518.3 963.1 100.9 733.3 100.9 304.3"/>
    <polygon fill="#F7931E" fill-opacity="0.7" points="935.7 294.1 935.7 733.3 518.3 963.1 518.3 521"/>
    <polygon fill="#FBB03B" fill-opacity="0.8" points="100.9 304.3 527.2 74.6 935.7 294.1 935.7 513.7 518.3 743.5 100.9 513.7"/>
  </svg>
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
      addMessageToUI(message.result);
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

  function sendCancelRequest() {
    vscode.postMessage({ type: "cancel_request" });
  }

  function sendOpenLinkRequest(linkType, link) {
    vscode.postMessage({ type: "open_link_request", linkType, link });
  }

  function clearAllMessages() {
    assistantMessageFinished();
    chatContainer.textContent = "";
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
      withStickyScroll(addAssistantMessageToUI)(result);
    } else {
      withScroll(addUserMessageToUI)(result.textContent);
      withScroll(addAssistantThinkingMessageToUI)();
    }
  }

  // After the function completes, scroll the message container if it was already scrolled to the bottom
  function withStickyScroll(wrapped) {
    return function () {
      const { scrollHeight: scrollHeightBefore } = messageContainer;
      wrapped.apply(this, arguments);
      const { scrollHeight, scrollTop, clientHeight } = messageContainer;
      const scrollDiff = Math.abs(scrollHeight - clientHeight - scrollTop);
      const isScrolledToBottom =
        scrollDiff <= scrollHeight - scrollHeightBefore + 1;

      if (isScrolledToBottom) {
        messageContainer.scrollTop = scrollHeight - clientHeight;
      }
    };
  }

  // After the function completes, scroll the message container to the bottom.
  function withScroll(wrapped) {
    return function () {
      wrapped.apply(this, arguments);
      const { clientHeight, scrollHeight } = messageContainer;
      messageContainer.scrollTop = scrollHeight - clientHeight;
    };
  }
  // If we're already at the bottom, scroll the bottom into view

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
        "sidebar__chat-assistant--chat-bubble-text--code-action-button"
      );
      button.onclick = async () => {
        await navigator.clipboard.writeText(text);
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="sidebar__chat-assistant--code-block-action-button-icon"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
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
      return button;
    }
  };

  const setupReplaceButton = (block) => {
    let text = block.querySelector("code").innerText;
    let button = document.createElement("button");
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="sidebar__chat-assistant--code-block-action-button-icon" viewBox="0 0 512 512"><path d="M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zm-47-201L201 79c-15-15-41-4.5-41 17v96H24c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24h136v96c0 21.5 26 32 41 17l168-168c9.3-9.4 9.3-24.6 0-34z"/></svg>
    `;
    button.title = "Insert code at cursor";
    button.classList.add(
      "sidebar__chat-assistant--chat-bubble-text--code-action-button"
    );
    button.onclick = async () => {
      vscode.postMessage({ type: "insert_at_cursor", content: text });
    };
    return button;
  };

  const setupActionButtons = (block) => {
    let buttonGroup = document.createElement("div");
    buttonGroup.classList.add(
      "sidebar__chat-assistant--chat-bubble-text--code-action-buttons"
    );
    let copyButton = setupCopyButton(block);
    let replaceButton = setupReplaceButton(block);
    buttonGroup.append(copyButton, replaceButton);
    block.appendChild(buttonGroup);
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
      blocks.forEach(setupActionButtons);

      let httpLinks =
        currentAssistantMessage.querySelectorAll('a[href*="http"]');
      httpLinks.forEach((link) => {
        link.addEventListener("click", () => {
          sendOpenLinkRequest("url", link.href);
        });
      });
      let fileLinks = currentAssistantMessage.querySelectorAll(
        'a[href="VALID_FILE"]'
      );
      fileLinks.forEach((link) => {
        link.addEventListener("click", () => {
          sendOpenLinkRequest("file", link.innerText);
        });
      });
      let folderLinks = currentAssistantMessage.querySelectorAll(
        'a[href="VALID_DIRECTORY"]'
      );
      folderLinks.forEach((link) => {
        link.addEventListener("click", () => {
          sendOpenLinkRequest("directory", link.innerText);
        });
      });
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
