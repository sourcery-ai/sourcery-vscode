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
function withStickyScroll(container, wrapped) {
    return function () {
        var scrollHeightBefore = container.scrollHeight;
        wrapped.apply(this, arguments);
        var scrollHeight = container.scrollHeight, scrollTop = container.scrollTop, clientHeight = container.clientHeight;
        var scrollDiff = Math.abs(scrollHeight - clientHeight - scrollTop);
        var isScrolledToBottom = scrollDiff <= scrollHeight - scrollHeightBefore + 1;
        if (isScrolledToBottom) {
            container.scrollTop = scrollHeight - clientHeight;
        }
    };
}
function createElement(_a) {
    var _b;
    var tagName = _a.tagName, classList = _a.classList, id = _a.id, _c = _a.children, children = _c === void 0 ? [] : _c;
    // Generically create an element and attach its children
    var element = document.createElement(tagName);
    (_b = element.classList).add.apply(_b, classList);
    element.id = id;
    children.forEach(function (child) { return element.appendChild(child); });
    return element;
}
function createButtonGroup(children) {
    return createElement({
        tagName: "div",
        classList: ["troubleshooting__button_group"],
        children: children
    });
}
function createPrompt() {
    // Create the prompt and add custom placeholder and ID
    var prompt = createElement({
        tagName: "textarea",
        classList: ["troubleshooting__prompt"]
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
        classList: ["troubleshooting__button", "troubleshooting__button--submit"]
    });
    submitButton.innerText = "Submit";
    submitButton.onclick = function () {
        postMessage({ action: "submit", promptValue: getPrompt().value });
        getInput().classList.add("troubleshooting__input--hidden");
    };
    return submitButton;
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
function messageHandler(postMessage) {
    function handleInputMessage(_a) {
        var _b = _a.data, type = _b.type, content = _b.content;
        var mainSection = getMainSection();
        var p = createElement({
            tagName: "p",
            classList: [
                "troubleshooting__message",
                "troubleshooting__message--assistance",
            ]
        });
        p.innerHTML = content;
        var yesButton = createElement({
            tagName: "button",
            classList: ["troubleshooting__button"]
        });
        yesButton.innerHTML = "\n      Yes <svg xmlns=\"http://www.w3.org/2000/svg\" height=\"1em\" viewBox=\"0 0 448 512\"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d=\"M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z\"/></svg>\n    ";
        var noButton = createElement({
            tagName: "button",
            classList: ["troubleshooting__button"]
        });
        noButton.innerHTML = "\n      No <svg xmlns=\"http://www.w3.org/2000/svg\" height=\"1em\" viewBox=\"0 0 384 512\"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d=\"M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z\"/></svg>\n    ";
        yesButton.onclick = function () {
            postMessage({ action: "resume", promptValue: true });
            yesButton.classList.add("troubleshooting__button--disabled");
            noButton.classList.add("troubleshooting__button--disabled", "troubleshooting__button--deselected");
            yesButton.disabled = true;
            noButton.disabled = true;
        };
        noButton.onclick = function () {
            postMessage({ action: "resume", promptValue: false });
            yesButton.classList.add("troubleshooting__button--disabled", "troubleshooting__button--deselected");
            noButton.classList.add("troubleshooting__button--disabled");
            yesButton.disabled = true;
            noButton.disabled = true;
        };
        var buttonGroup = createButtonGroup([yesButton, noButton]);
        var newMessage = createElement({
            tagName: "div",
            classList: ["troubleshooting__message", "troubleshooting__message--user"],
            children: [buttonGroup]
        });
        newMessage.classList.add("troubleshooting__message--user");
        mainSection.append(p, newMessage);
    }
    function handleMessage(_a) {
        var _b = _a.data, type = _b.type, content = _b.content;
        switch (type) {
            case "input":
                handleInputMessage({
                    data: {
                        type: type,
                        content: content
                    }
                });
                break;
            case "reset":
                postMessage({ action: "reset" });
                getMainSection().replaceChildren();
                getInput().classList.remove("troubleshooting__input--hidden");
                break;
            default:
                var mainSection = getMainSection();
                var newMessage = createElement({
                    tagName: "p",
                    classList: [
                        "troubleshooting__message",
                        "troubleshooting__message--" + type,
                    ]
                });
                newMessage.innerHTML = content;
                mainSection.appendChild(newMessage);
        }
    }
    return handleMessage;
}
function init(postMessage) {
    // Add children to main element
    // It's easier to do this in the script because we can reload the webview in development, rather than restarting
    // the whole extension development host.
    getBody().append(createElement({
        tagName: "section",
        classList: ["troubleshooting__input"],
        id: "input",
        children: [createPrompt(), createSubmitButton(postMessage)]
    }), createElement({
        tagName: "section",
        classList: ["troubleshooting__main"],
        id: "main"
    }), createElement({
        tagName: "footer",
        classList: ["troubleshooting__footer"],
        id: "footer"
    }));
    window.addEventListener("message", withStickyScroll(getMainSection(), messageHandler(postMessage)));
}
(function () {
    var vscode = acquireVsCodeApi();
    var postMessage = createMessagePoster(vscode);
    init(postMessage);
})();
