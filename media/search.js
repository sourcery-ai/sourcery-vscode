//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {

    const vscode = acquireVsCodeApi();

    document.querySelector('.scanner-button').addEventListener('click', () => {
        sendMessageToExtension('scan');
    });
    document.querySelector('.save-button').addEventListener('click', () => {
        sendMessageToExtension('save');
    });
    document.querySelector('.replace-button').addEventListener('click', () => {
        sendMessageToExtension('replace');
    });

    // Sort the height of the advanced rule input
    const basic = document.querySelector('#patternContainer');
    const advanced = document.querySelector('#advancedContainer');
    const advancedArea = document.querySelector('textarea.ruleInput');

    advanced.style.height = basic.offsetHeight + 'px';
    advancedArea.style.height = basic.offsetHeight - 15 + 'px';

    window.addEventListener('message', event => {
      const message = event.data;

      if (message.command === 'toggle') {
          basic.classList.toggle("hidden");
          advanced.classList.toggle("hidden");
      } else if (message.command === "setPattern") {
          const input = document.querySelector('textarea.patternInput');
          input.value = message.pattern;
      }
    });

    const input = document.querySelector('textarea.patternInput');
    if (input) {
        input.focus();
    }


    // This is handled by the RuleInputProvider
    function sendMessageToExtension(message_type) {
        let rule;
        let advanced;
        if (basic.classList.contains("hidden")) {
            const ruleInput = document.querySelector('textarea.ruleInput');
            rule = {rule: ruleInput.value}
            advanced = true;
        } else {
            const replacementInput = document.querySelector('textarea.replacementInput');
            const conditionInput = document.querySelector('textarea.conditionInput');
            rule = {pattern: input.value, replacement: replacementInput.value, condition: conditionInput.value};
            advanced = false;
        }

        vscode.postMessage({ type: message_type, advanced: advanced, rule: rule});
    }

}());


