"use strict";

import { commands, WebviewView, WebviewViewProvider } from "vscode";

export class CodingAssistantOptInProvider implements WebviewViewProvider {
  public static readonly viewType = "sourcery.coding_assistant_opt_in";

  public async resolveWebviewView(webviewView: WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage(async (_message) =>
      commands.executeCommand("sourcery.coding_assistant.opt_in")
    );

    webviewView.webview.html = `<!DOCTYPE html>
<html>
<head>
  <title>Opt-In Form</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }

    h2 {
      margin-top: 0px;
      margin-bottom: 20px;
    }

    p {
      margin-bottom: 10px;
    }

    .opt-in-form {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
    }

    .opt-in-button {
      display: block;
      width: 100%;
      margin-top: 15px;
      padding: 10px;
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="opt-in-form">
    <h2>Sourcery Coding Assistant</h2>
    <p>By enabling the Sourcery coding assistant, you agree that Sourcery can send your code to third party LLMs for analysis (OpenAI, Anthropic).</p>
    <p>None of your code is ever stored on our servers.</p>
    <form onsubmit="submitForm(event)">
      <button class="opt-in-button">Enable</button>
    </form>
  </div>
</body>
<script>
  function submitForm(event) {
    event.preventDefault();
    const vscode = acquireVsCodeApi();
    vscode.postMessage({});
  }
</script>
</html>`;
  }
}
