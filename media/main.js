//@ts-check


const vscode = acquireVsCodeApi();
console.log("starting");
window.alert("starting");

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    document.querySelector('.scanner-button').addEventListener('click', () => {
        sendMessage('scanForPattern');
    });
    document.querySelector('.replace-button').addEventListener('click', () => {
        sendMessage('replacePattern');
    });
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'addColor':
                {
                    addColor();
                    break;
                }

        }
    });


    function sendMessage(message_type) {
        const patternInput = document.querySelector('textarea.patternInput');
        const replacementInput = document.querySelector('textarea.replacementInput');
        const conditionInput = document.querySelector('textarea.conditionInput');

        vscode.postMessage({ type: message_type, pattern: patternInput.value, replacement: replacementInput.value, condition: conditionInput.value});
    }

}());


