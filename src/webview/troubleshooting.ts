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

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className: string,
  children: HTMLElement[] = []
): HTMLElementTagNameMap[K] {
  // Generically create an element and attach its children
  const element = document.createElement(tagName);
  element.className = className;
  children.forEach((child) => element.appendChild(child));
  return element;
}

function createPrompt(): HTMLTextAreaElement {
  // Create the prompt and add custom placeholder and ID
  const prompt = createElement("textarea", "troubleshooting__prompt");
  prompt.id = "prompt";
  prompt.placeholder = "Describe the issue in detail.";
  return prompt;
}

function getPrompt(): HTMLTextAreaElement {
  // Return the prompt, if it exists (which it should)
  return document.getElementById("prompt") as HTMLTextAreaElement;
}

function createSubmitButton(postMessage: PostMessage): HTMLButtonElement {
  // Create the submit button and attach submit action
  // Would this system be better as a form?
  const submitButton = createElement("button", "troubleshooting__send_button");
  submitButton.innerText = "Submit";
  submitButton.onclick = () => {
    postMessage({ action: "submit", promptValue: getPrompt().value });
  };
  return submitButton;
}

function getMain() {
  return document.getElementById("main");
}

function init(postMessage: PostMessage) {
  // Add children to main element
  // It's easier to do this in the script because we can reload the webview in development, rather than restarting
  // the whole extension development host.
  getMain().append(
    createElement("section", "troubleshooting__input", [
      createPrompt(),
      createSubmitButton(postMessage),
    ]),
    createElement("section", "troubleshooting__main")
  );

  window.addEventListener("message", ({ data }) => console.log(data));
}

(function () {
  const vscode = acquireVsCodeApi();
  const postMessage = createMessagePoster(vscode);
  init(postMessage);
})();
