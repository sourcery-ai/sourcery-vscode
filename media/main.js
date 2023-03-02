//@ts-check



// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {

    const vscode = acquireVsCodeApi();

    document.querySelector('.scanner-button').addEventListener('click', () => {
        sendMessage('scanForPattern');
    });
    document.querySelector('.save-button').addEventListener('click', () => {
        sendMessage('savePattern');
    });
    document.querySelector('.replace-button').addEventListener('click', () => {
        sendMessage('replacePattern');
    });


    let input = document.querySelector('textarea.patternInput');
    if (input) {
        input.focus();
    }


    function sendMessage(message_type) {
        const patternInput = document.querySelector('textarea.patternInput');
        const replacementInput = document.querySelector('textarea.replacementInput');
        const conditionInput = document.querySelector('textarea.conditionInput');

        vscode.postMessage({ type: message_type, pattern: patternInput.value, replacement: replacementInput.value, condition: conditionInput.value});
    }

}());


