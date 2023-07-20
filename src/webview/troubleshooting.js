/**
 * Script for the Troubleshooting webview.
 *
 * This TypeScript file should be compiled using `npm run compile-webviews` which will create an associated
 * JavaScript file, which is what is actually included in the webview HTML.
 * */
function createMessagePoster(vscode) {
    // Create a wrapper function which is strongly typed
    return function (message) { return vscode.postMessage(message); };
}
function createElement(_a) {
    var tagName = _a.tagName, className = _a.className, id = _a.id, _b = _a.children, children = _b === void 0 ? [] : _b;
    // Generically create an element and attach its children
    var element = document.createElement(tagName);
    element.className = className;
    element.id = id;
    children.forEach(function (child) { return element.appendChild(child); });
    return element;
}
function createPrompt() {
    // Create the prompt and add custom placeholder and ID
    var prompt = createElement({
        tagName: "textarea",
        className: "troubleshooting__prompt"
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
        className: "troubleshooting__send_button"
    });
    submitButton.innerText = "Submit";
    submitButton.onclick = function () {
        postMessage({ action: "submit", promptValue: getPrompt().value });
    };
    return submitButton;
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
    var data = _a.data;
    var mainSection = getMainSection();
    var newMessage = createElement({
        tagName: "p",
        className: "troubleshooting__message"
    });
    newMessage.textContent = data;
    mainSection.appendChild(newMessage);
}
function init(postMessage) {
    // Add children to main element
    // It's easier to do this in the script because we can reload the webview in development, rather than restarting
    // the whole extension development host.
    getBody().append(createElement({
        tagName: "section",
        className: "troubleshooting__input",
        children: [createPrompt(), createSubmitButton(postMessage)]
    }), createElement({
        tagName: "section",
        className: "troubleshooting__main",
        id: "main"
    }));
    window.addEventListener("message", handleMessage);
}
(function () {
    var vscode = acquireVsCodeApi();
    var postMessage = createMessagePoster(vscode);
    init(postMessage);
})();
