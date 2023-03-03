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

    let basic = document.querySelector('#patternContainer');
    let advanced = document.querySelector('#advancedContainer');
    let advancedArea = document.querySelector('textarea.ruleInput');

    advanced.style.height = basic.offsetHeight + 'px';
    advancedArea.style.height = basic.offsetHeight - 15 + 'px';

    window.addEventListener('message', event => {
      const message = event.data;
      console.log("received message");

      if (message.command === 'toggle') {
        // do something with the data
          console.log("received toggle message");

          let basic = document.querySelector('#patternContainer');
          let advanced = document.querySelector('#advancedContainer');
          if (basic && advanced) {
              basic.classList.toggle("hidden");
              advanced.classList.toggle("hidden");
          }
      }
    });

    let input = document.querySelector('textarea.patternInput');
    if (input) {
        input.focus();
    }


    function sendMessage(message_type) {
        let basic = document.querySelector('#patternContainer');
        let rule;
        let advanced;
        if (basic.classList.contains("hidden")) {
            const ruleInput = document.querySelector('textarea.ruleInput');
            rule = {rule: ruleInput.value}
            advanced = true;
        } else {
            const patternInput = document.querySelector('textarea.patternInput');
            const replacementInput = document.querySelector('textarea.replacementInput');
            const conditionInput = document.querySelector('textarea.conditionInput');
            rule = {pattern: patternInput.value, replacement: replacementInput.value, condition: conditionInput.value};
            advanced = false;
        }

        vscode.postMessage({ type: message_type, advanced: advanced, rule: rule});
    }

}());


