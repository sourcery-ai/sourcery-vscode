/**
 * Script for the Troubleshooting webview.
 *
 * This TypeScript file should be compiled using `npm run compile-webviews` which will create an associated
 * JavaScript file, which is what is actually included in the webview HTML.
 * */

declare const acquireVsCodeApi: any;

type SubmitOutboundMessage = {
  action: "submit";
  promptValue: string;
};
type ResumeOutboundMessage = {
  action: "resume";
  promptValue: string | boolean;
};

type RetryOutboundMessage = {
  action: "retry";
};

type ResetOutboundMessage = {
  action: "reset";
};

type OpenLinkRequestOutboundMessage = {
  action: "openLink";
  linkType: "file" | "url"; // TODO: handle directories
  target: string;
};

type InsertAtCursorOutboundMessage = {
  action: "insertAtCursor";
  content: string;
};

type OutboundMessage =
  | SubmitOutboundMessage
  | ResumeOutboundMessage
  | RetryOutboundMessage
  | ResetOutboundMessage
  | OpenLinkRequestOutboundMessage
  | InsertAtCursorOutboundMessage;

type InputInboundMessage = {
  type: "input";
  kind: "yesno" | "text";
  content?: string;
};

type FeedbackMessage = {
  type: "feedback";
  content: string;
};

type AssistanceMessage = {
  type: "assistance";
  content: string;
};

type InboundMessage =
  | InputInboundMessage
  | FeedbackMessage
  | AssistanceMessage
  | {
      type: "reset";
    }
  | {
      type: "warning" | "user" | "error";
      content: string;
    };

type PostMessage = (message: OutboundMessage) => void;

function createMessagePoster(vscode: any): PostMessage {
  // Create a wrapper function which is strongly typed
  return (message: OutboundMessage) => vscode.postMessage(message);
}

function withStickyScroll(container: HTMLElement, wrapped) {
  return function () {
    const { scrollHeight: scrollHeightBefore } = container;
    wrapped.apply(this, arguments);
    const { scrollHeight, scrollTop, clientHeight } = container;
    const scrollDiff = Math.abs(scrollHeight - clientHeight - scrollTop);
    const isScrolledToBottom =
      scrollDiff <= scrollHeight - scrollHeightBefore + 1;

    if (isScrolledToBottom) {
      container.scrollTop = scrollHeight - clientHeight;
    }
  };
}

type Props<K extends keyof HTMLElementTagNameMap> = {
  tagName: K;
  classList?: string[];
  id?: any;
  children?: HTMLElement[];
};

function createElement<K extends keyof HTMLElementTagNameMap>({
  tagName,
  classList,
  id,
  children = [],
}: Props<K>): HTMLElementTagNameMap[K] {
  // Generically create an element and attach its children
  const element = document.createElement(tagName);
  element.classList.add(...classList);
  element.id = id;
  children.forEach((child) => element.appendChild(child));
  return element;
}

function createButtonGroup(children: HTMLButtonElement[]): HTMLDivElement {
  return createElement({
    tagName: "div",
    classList: ["troubleshooting__button_group"],
    children,
  });
}

function createPrompt(): HTMLTextAreaElement {
  // Create the prompt and add custom placeholder and ID
  const prompt = createElement({
    tagName: "textarea",
    classList: ["troubleshooting__prompt"],
  });
  prompt.id = "prompt";
  prompt.placeholder = "Describe the issue in detail.";
  return prompt;
}

function createSubmitButton(postMessage: PostMessage): HTMLButtonElement {
  // Create the submit button and attach submit action
  // Would this system be better as a form?
  const submitButton = createElement({
    tagName: "button",
    classList: ["troubleshooting__button", "troubleshooting__button--submit"],
  });
  submitButton.innerText = "Submit";
  submitButton.onclick = () => {
    postMessage({ action: "submit", promptValue: getPrompt().value });
    getInput().classList.add("troubleshooting__input--hidden");
  };
  return submitButton;
}

function getInput(): HTMLElement {
  return document.getElementById("input");
}

function getPrompt(): HTMLTextAreaElement {
  // Return the prompt, if it exists (which it should)
  return document.getElementById("prompt") as HTMLTextAreaElement;
}

function getMainSection(): HTMLElement {
  return document.getElementById("main");
}

function getBody() {
  return document.getElementById("body");
}

function getLastFeedbackMessage() {
  let feedbackMessages = document.getElementsByClassName(
    "troubleshooting__message--feedback"
  );
  return feedbackMessages.item(feedbackMessages.length - 1);
}

function messageHandler(postMessage: PostMessage) {
  const setupCopyButton = (block: HTMLElement) => {
    if (navigator.clipboard) {
      let text = block.querySelector("code").innerText;
      let button = document.createElement("button");
      button.innerHTML = `
      <svg 
        viewBox="0 0 512 512" 
        xmlns="http://www.w3.org/2000/svg"
        class="troubleshooting__code_block_action_button_icon"
      >
        <path d="m272 0h124.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9v220.1c0 26.5-21.5 48-48 48h-192c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48zm-224 128h144v64h-128v256h192v-32h64v48c0 26.5-21.5 48-48 48h-224c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48z" />        
      </svg>
    `;
      button.title = "Copy to Clipboard";
      button.classList.add("troubleshooting__code_block_action_button");
      button.onclick = async () => {
        await navigator.clipboard.writeText(text);
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="troubleshooting__code_block_action_button_icon"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
      };
      button.onblur = async () => {
        button.innerHTML = `
        <svg 
          viewBox="0 0 512 512" 
          xmlns="http://www.w3.org/2000/svg"
          class="troubleshooting__code_block_action_button_icon"
        >
          <path d="m272 0h124.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9v220.1c0 26.5-21.5 48-48 48h-192c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48zm-224 128h144v64h-128v256h192v-32h64v48c0 26.5-21.5 48-48 48h-224c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48z" />        
        </svg>
      `;
      };
      return button;
    }
  };

  const setupReplaceButton = (block: HTMLElement) => {
    let text = block.querySelector("code").innerText;
    let button = document.createElement("button");
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="troubleshooting__code_block_action_button_icon" viewBox="0 0 512 512"><path d="M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zm-47-201L201 79c-15-15-41-4.5-41 17v96H24c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24h136v96c0 21.5 26 32 41 17l168-168c9.3-9.4 9.3-24.6 0-34z"/></svg>
    `;
    button.title = "Insert code at cursor";
    button.classList.add("troubleshooting__code_block_action_button");
    button.onclick = async () => {
      postMessage({ action: "insertAtCursor", content: text });
    };
    return button;
  };

  const setupActionButtons = (block: HTMLElement) => {
    const copyButton = setupCopyButton(block);
    const replaceButton = setupReplaceButton(block);
    return createElement({
      tagName: "div",
      classList: ["troubleshooting__code_block_action_button_group"],
      children: [copyButton, replaceButton],
    });
  };

  const setupLinks = (block: HTMLElement) => {
    block
      .querySelectorAll('a[href*="http"]')
      .forEach((link: HTMLAnchorElement) =>
        link.addEventListener("click", () =>
          postMessage({
            action: "openLink",
            linkType: "url",
            target: link.href,
          })
        )
      );
    block
      .querySelectorAll('a[href*="file"]')
      .forEach((link: HTMLAnchorElement) =>
        link.addEventListener("click", () =>
          postMessage({
            action: "openLink",
            linkType: "file",
            target: link.href,
          })
        )
      );
  };

  const createYesNoUserInput = () => {
    const mainSection = getMainSection();
    const yesButton = createElement({
      tagName: "button",
      classList: ["troubleshooting__button"],
    });
    yesButton.innerHTML = `
      Yes <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
    `;

    const noButton = createElement({
      tagName: "button",
      classList: ["troubleshooting__button"],
    });
    noButton.innerHTML = `
      No <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
    `;

    yesButton.onclick = () => {
      postMessage({ action: "resume", promptValue: true });
      yesButton.classList.add("troubleshooting__button--disabled");
      noButton.classList.add(
        "troubleshooting__button--disabled",
        "troubleshooting__button--deselected"
      );

      yesButton.disabled = true;
      noButton.disabled = true;
    };
    noButton.onclick = () => {
      postMessage({ action: "resume", promptValue: false });
      yesButton.classList.add(
        "troubleshooting__button--disabled",
        "troubleshooting__button--deselected"
      );
      noButton.classList.add("troubleshooting__button--disabled");

      yesButton.disabled = true;
      noButton.disabled = true;
    };

    const buttonGroup = createButtonGroup([yesButton, noButton]);

    const newMessage = createElement({
      tagName: "div",
      classList: ["troubleshooting__message", "troubleshooting__message--user"],
      children: [buttonGroup],
    });
    mainSection.append(newMessage);
  };

  const createTextUserInput = () => {
    const mainSection = getMainSection();
    const textInput = createElement({
      tagName: "textarea",
      classList: ["troubleshooting__prompt"],
    });
    const submitButton = createElement({
      tagName: "button",
      classList: ["troubleshooting__prompt_submit_button"],
    });
    const promptWrapper = createElement({
      tagName: "div",
      classList: ["troubleshooting__prompt_wrapper"],
      children: [textInput, submitButton],
    });

    const newMessage = createElement({
      tagName: "div",
      classList: ["troubleshooting__message", "troubleshooting__message--user"],
      children: [promptWrapper],
    });

    const onSubmit = () => {
      const promptValue = textInput.value;
      postMessage({ action: "resume", promptValue });
      promptWrapper.remove();
      const par = createElement({ tagName: "p" });
      par.innerText = promptValue;
      newMessage.append(par);
    };

    submitButton.innerHTML = `
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="sidebar__chat-assistant--textarea-send-icon">
        <path d="m498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6l-119.6-49.7-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1s-20.3-16.7-20.3-29.9v-83.6c0-4 1.5-7.8 4.2-10.7l167.6-182.9c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7l-203.4 180.7-88.3-44.2c-10.6-5.3-17.4-15.9-17.7-27.7s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
      </svg>
    `;
    submitButton.onclick = onSubmit;

    // Listen for return key in order to send user messages
    textInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    });
    mainSection.append(newMessage);
    textInput.focus();
  };

  const handleInputMessage = ({ content, kind }: InputInboundMessage) => {
    const mainSection = getMainSection();
    if (content) {
      const p = createElement({
        tagName: "p",
        classList: [
          "troubleshooting__message",
          "troubleshooting__message--assistance",
        ],
      });
      p.innerHTML = content;
      mainSection.append(p);
    }
    switch (kind) {
      case "yesno":
        createYesNoUserInput();
        break;
      case "text":
        createTextUserInput();
        break;
    }
  };

  const handleFeedbackMessage = ({ content }: FeedbackMessage) => {
    const newMessage = createElement({
      tagName: "p",
      classList: [
        "troubleshooting__message",
        "troubleshooting__message--feedback",
        "troubleshooting__message--running",
      ],
    });
    newMessage.innerHTML = content;
    getMainSection().appendChild(newMessage);
  };

  const handleAssistanceMessage = ({ content }: AssistanceMessage) => {
    const newMessage = createElement({
      tagName: "p",
      classList: [
        "troubleshooting__message",
        "troubleshooting__message--assistance",
      ],
    });
    newMessage.innerHTML = content;
    newMessage.querySelectorAll("pre").forEach((element) => {
      element.appendChild(setupActionButtons(element));
    });
    setupLinks(newMessage);
    getMainSection().appendChild(newMessage);
  };

  const handleMessage = ({ data }: { data: InboundMessage }) => {
    getLastFeedbackMessage()?.classList.remove(
      "troubleshooting__message--running"
    );
    switch (data.type) {
      case "input":
        handleInputMessage(data);
        break;
      case "reset":
        postMessage({ action: "reset" });
        getMainSection().replaceChildren();
        getInput().classList.remove("troubleshooting__input--hidden");
        break;
      case "feedback":
        handleFeedbackMessage(data);
        break;
      case "assistance":
        handleAssistanceMessage(data);
        break;
      default:
        const newMessage = createElement({
          tagName: "p",
          classList: [
            "troubleshooting__message",
            "troubleshooting__message--" + data.type,
          ],
        });
        newMessage.innerHTML = data.content;
        getMainSection().appendChild(newMessage);
    }
  };

  return handleMessage;
}

function init(postMessage: PostMessage) {
  // Add children to main element
  // It's easier to do this in the script because we can reload the webview in development, rather than restarting
  // the whole extension development host.
  getBody().append(
    createElement({
      tagName: "section",
      classList: ["troubleshooting__input"],
      id: "input",
      children: [createPrompt(), createSubmitButton(postMessage)],
    }),
    createElement({
      tagName: "section",
      classList: ["troubleshooting__main"],
      id: "main",
    }),
    createElement({
      tagName: "footer",
      classList: ["troubleshooting__footer"],
      id: "footer",
    })
  );

  window.addEventListener(
    "message",
    withStickyScroll(getMainSection(), messageHandler(postMessage))
  );
}

(function () {
  const vscode = acquireVsCodeApi();
  const postMessage = createMessagePoster(vscode);
  init(postMessage);
})();
