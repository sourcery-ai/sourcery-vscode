//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {

    const vscode = acquireVsCodeApi();
    var chatContainer = document.querySelector('.chatContainer');
    var messageInput = document.querySelector('.message-input');

    // Function to add a user message to the chat interface
    function addUserMessage(message) {
        var userMessageElement = document.createElement('div');
        userMessageElement.classList.add('user-message');
        userMessageElement.textContent = message;
        chatContainer.append(userMessageElement);
    }

    // Function to add an assistant message to the chat interface
    function addAssistantMessage(message) {
        var assistantMessageElement = document.createElement('div');
        assistantMessageElement.classList.add('assistant-message');
        assistantMessageElement.textContent = message;
        chatContainer.append(assistantMessageElement);
    }

    messageInput.addEventListener('keypress', (e) => {
        if (e.which === 13) {
            e.preventDefault();
            addUserMessage(messageInput.value.trim());
            messageInput.value = "";
            addAssistantMessage("test response");
        }
    });



    // This is handled by the RuleInputProvider
    function sendMessageToExtension(message_type) {

        vscode.postMessage({ type: message_type});
    }

}());