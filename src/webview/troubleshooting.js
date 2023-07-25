/**
 * Script for the Troubleshooting webview.
 *
 * This TypeScript file should be compiled using `npm run compile-webviews` which will create an associated
 * JavaScript file, which is what is actually included in the webview HTML.
 * */
function createMessagePoster(vscode) {
  // Create a wrapper function which is strongly typed
  return function (message) {
    return vscode.postMessage(message);
  };
}
function withStickyScroll(container, wrapped) {
  return function () {
    var scrollHeightBefore = container.scrollHeight;
    wrapped.apply(this, arguments);
    var scrollHeight = container.scrollHeight,
      scrollTop = container.scrollTop,
      clientHeight = container.clientHeight;
    var scrollDiff = Math.abs(scrollHeight - clientHeight - scrollTop);
    var isScrolledToBottom =
      scrollDiff <= scrollHeight - scrollHeightBefore + 1;
    if (isScrolledToBottom) {
      container.scrollTop = scrollHeight - clientHeight;
    }
  };
}
function createElement(_a) {
  var tagName = _a.tagName,
    className = _a.className,
    id = _a.id,
    _b = _a.children,
    children = _b === void 0 ? [] : _b;
  // Generically create an element and attach its children
  var element = document.createElement(tagName);
  element.className = className;
  element.id = id;
  children.forEach(function (child) {
    return element.appendChild(child);
  });
  return element;
}
function createButtonGroup(children) {
  return createElement({
    tagName: "div",
    className: "troubleshooting__button_group",
    children: children,
  });
}
function createPrompt() {
  // Create the prompt and add custom placeholder and ID
  var prompt = createElement({
    tagName: "textarea",
    className: "troubleshooting__prompt",
  });
  prompt.id = "prompt";
  prompt.placeholder = "Describe the issue in detail.";
  return prompt;
}
function createSubmitButton(postMessage) {
  // Create the submit button and attach submit action
  // Would this system be better as a form?
  var submitButton = createElement({
    tagName: "button",
    className: "troubleshooting__button",
  });
  submitButton.classList.add("troubleshooting__button--submit");
  submitButton.innerText = "Submit";
  submitButton.onclick = function () {
    postMessage({ action: "submit", promptValue: getPrompt().value });
    getInput().classList.add("troubleshooting__input--hidden");
  };
  return submitButton;
}
function createResetButton(postMessage) {
  var resetButton = createElement({
    tagName: "button",
    className: "troubleshooting__button",
  });
  resetButton.classList.add("troubleshooting__button--reset");
  resetButton.innerText = "Reset";
  resetButton.onclick = function () {
    postMessage({ action: "reset" });
    getMainSection().replaceChildren();
    getInput().classList.remove("troubleshooting__input--hidden");
  };
  return resetButton;
}
function createRetryButton(postMessage) {
  var retryButton = createElement({
    tagName: "button",
    className: "troubleshooting__button",
  });
  retryButton.classList.add("troubleshooting__button--retry");
  retryButton.innerText = "Retry";
  retryButton.onclick = function () {
    getMainSection().replaceChildren(); // remove all children
    getInput().classList.add("troubleshooting__input--hidden");
    postMessage({ action: "retry" });
  };
  return retryButton;
}
function getInput() {
  return document.getElementById("input");
}
function getPrompt() {
  // Return the prompt, if it exists (which it should)
  return document.getElementById("prompt");
}
function getMainSection() {
  return document.getElementById("main");
}
function getBody() {
  return document.getElementById("body");
}
function handleMessage(_a) {
  var _b = _a.data,
    type = _b.type,
    content = _b.content;
  var mainSection = getMainSection();
  var newMessage = createElement({
    tagName: "p",
    className: "troubleshooting__message",
  });
  newMessage.classList.add("troubleshooting__message--" + type);
  newMessage.innerHTML = content;
  mainSection.appendChild(newMessage);
}
function init(postMessage) {
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
    }),
    createElement({
      tagName: "footer",
      className: "troubleshooting__footer",
      id: "footer",
      children: [
        createButtonGroup([
          createRetryButton(postMessage),
          createResetButton(postMessage),
        ]),
      ],
    })
  );
  window.addEventListener(
    "message",
    withStickyScroll(getMainSection(), handleMessage)
  );
}
(function () {
  var vscode = acquireVsCodeApi();
  var postMessage = createMessagePoster(vscode);
  init(postMessage);
})();
