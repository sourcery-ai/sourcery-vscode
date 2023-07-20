"use strict";

import {
  CancellationToken,
  ExtensionContext,
  Uri,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  commands,
} from "vscode";
import { randomBytes } from "crypto";

type TroubleshootingResult = any;

interface Message {
  action: string;
}

export class TroubleshootingProvider implements WebviewViewProvider {
  public static readonly viewType = "sourcery.troubleshooting";
  private _view?: WebviewView;
  private _extensionUri: Uri;

  constructor(private _context: ExtensionContext) {
    this._extensionUri = _context.extensionUri;
  }

  public handleResult(result: TroubleshootingResult) {
    if (!this._view) {
      return;
    }
    this._view.webview.postMessage(result);
  }

  public async resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    token: CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.onDidReceiveMessage(async (message: Message) => {
      commands.executeCommand("sourcery.troubleshoot", message);
    });

    const styleSheets = [
      "reset.css",
      "vscode.css",
      "chat.css",
      "troubleshooting.css",
    ]
      .map((file) => Uri.joinPath(this._extensionUri, "media", file))
      .map((fileUri) => this._view.webview.asWebviewUri(fileUri))
      .map((webviewUri) => `<link href="${webviewUri}" rel="stylesheet">`)
      .join("\n");

    const scriptUri = webviewView.webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "src", "webview", "troubleshooting.js")
    );

    const nonce = randomBytes(16).toString("base64");

    const cspStr = `default-src 'none'; style-src ${webviewView.webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src * 'self' https:;`;

    webviewView.webview.html = `<!DOCTYPE html>
<html lang="en" style="height: 100%">
<head>
    <title>Troubleshooting</title>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${cspStr}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    ${styleSheets}
</head>
<body class="troubleshooting" id="body">

</body>
<script nonce="${nonce}" src="${scriptUri}"></script>
</html>
    `;
  }
}
