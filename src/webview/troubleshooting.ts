/**
 * Script for the Troubleshooting webview.
 *
 * This TypeScript file should be compiled using `npm run compile-webviews` which will create an associated
 * JavaScript file, which is what is actually included in the webview HTML.
 * */

declare const acquireVsCodeApi: any;

type SubmitMessage = {
  action: "submit";
  promptValue: string;
};

type Message = SubmitMessage; // anticipating future Message types

type PostMessage = (message: Message) => void;

function createMessagePoster(vscode: any): PostMessage {
  // Create a wrapper function which is strongly typed
  return (message: Message) => vscode.postMessage(message);
}

type Props<K extends keyof HTMLElementTagNameMap> = {
  tagName: K;
  className: string;
  id?: any;
  children?: HTMLElement[];
};

function createElement<K extends keyof HTMLElementTagNameMap>({
  tagName,
  className,
  id,
  children = [],
}: Props<K>): HTMLElementTagNameMap[K] {
  // Generically create an element and attach its children
  const element = document.createElement(tagName);
  element.className = className;
  element.id = id;
  children.forEach((child) => element.appendChild(child));
  return element;
}

function createPrompt(): HTMLTextAreaElement {
  // Create the prompt and add custom placeholder and ID
  const prompt = createElement({
    tagName: "textarea",
    className: "troubleshooting__prompt",
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
    className: "troubleshooting__send_button",
  });
  submitButton.innerText = "Submit";
  submitButton.onclick = () => {
    postMessage({ action: "submit", promptValue: getPrompt().value });
    getInput().remove();
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

function handleMessage({
  data: { type, content },
}: {
  data: { type: "user" | "feedback" | "assistance"; content: string };
}) {
  const mainSection = getMainSection();
  const newMessage = createElement({
    tagName: "p",
    className: "troubleshooting__message",
  });
  newMessage.classList.add("troubleshooting__message--" + type);
  newMessage.textContent = content;
  mainSection.appendChild(newMessage);
}

function init(postMessage: PostMessage) {
  // Add children to main element
  // It's easier to do this in the script because we can reload the webview in development, rather than restarting
  // the whole extension development host.
  getBody().append(
    createElement({
      tagName: "section",
      className: "troubleshooting__input",
      id: "input",
      children: [createPrompt(), createSubmitButton(postMessage)],
    }),
    createElement({
      tagName: "section",
      className: "troubleshooting__main",
      id: "main",
    })
  );

  window.addEventListener("message", handleMessage);
}

(function () {
  const vscode = acquireVsCodeApi();
  const postMessage = createMessagePoster(vscode);
  init(postMessage);
})();
