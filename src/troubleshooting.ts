"use strict";

import {
  CancellationToken,
  ColorThemeKind,
  commands,
  ExtensionContext,
  Uri,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from "vscode";
import { randomBytes } from "crypto";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { renderMarkdownMessage } from "./chat";

// NOTE: marked code block formatting relies on the `marked.use` block in `chat.ts`

type TroubleshootingResult = {
  type: "error" | "assistance" | "feedback" | "user" | string;
  content: string;
};

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

  public handleReset() {
    if (!this._view) {
      return;
    }
    this._view.webview.postMessage({ type: "reset" });
  }

  public handleResult(result: TroubleshootingResult) {
    if (!this._view) {
      return;
    }

    if (result.type === "user") {
      this._view.webview.postMessage(result);
    } else {
      const content = renderMarkdownMessage(result.content);
      this._view.webview.postMessage({
        ...result,
        content,
      });
    }
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

    // messages from inside the webview are sent on to the binary unchanged
    // it's the job of the troubleshooting handler to decide what to do with the message's `action`.
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

    let hljsUri;
    if (window.activeColorTheme.kind === ColorThemeKind.Light) {
      hljsUri = this._view.webview.asWebviewUri(
        Uri.joinPath(this._extensionUri, "media", "github.min.css")
      );
    } else {
      hljsUri = this._view.webview.asWebviewUri(
        Uri.joinPath(this._extensionUri, "media", "github-dark.min.css")
      );
    }

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
    <link href="${hljsUri}" rel="stylesheet">
</head>
<body class="troubleshooting" id="body">

</body>
<script nonce="${nonce}" src="${scriptUri}"></script>
</html>
    `;
  }
}
