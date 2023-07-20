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
function createElement(tagName, className, children) {
    if (children === void 0) { children = []; }
    // Generically create an element and attach its children
    var element = document.createElement(tagName);
    element.className = className;
    children.forEach(function (child) { return element.appendChild(child); });
    return element;
}
function createPrompt() {
    // Create the prompt and add custom placeholder and ID
    var prompt = createElement("textarea", "troubleshooting__prompt");
    prompt.id = "prompt";
    prompt.placeholder = "Describe the issue in detail.";
    return prompt;
}
function getPrompt() {
    // Return the prompt, if it exists (which it should)
    return document.getElementById("prompt");
}
function createSubmitButton(postMessage) {
    // Create the submit button and attach submit action
    // Would this system be better as a form?
    var submitButton = createElement("button", "troubleshooting__send_button");
    submitButton.innerText = "Submit";
    submitButton.onclick = function () {
        postMessage({ action: "submit", promptValue: getPrompt().value });
    };
    return submitButton;
}
function getMain() {
    return document.getElementById("main");
}
function init(postMessage) {
    // Add children to main element
    // It's easier to do this in the script because we can reload the webview in development, rather than restarting
    // the whole extension development host.
    getMain().append(createElement("section", "troubleshooting__input", [
        createPrompt(),
        createSubmitButton(postMessage),
    ]), createElement("section", "troubleshooting__main"));
    window.addEventListener("message", function (_a) {
        var data = _a.data;
        return console.log(data);
    });
}
(function () {
    var vscode = acquireVsCodeApi();
    var postMessage = createMessagePoster(vscode);
    init(postMessage);
})();
