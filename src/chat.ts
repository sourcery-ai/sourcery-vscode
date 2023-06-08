import * as vscode from "vscode";
import { randomBytes } from "crypto";

export class ChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "sourcery.chat";

  private _view?: vscode.WebviewView;

  private _extensionUri: vscode.Uri;

  constructor(private _context: vscode.ExtensionContext) {
    this._extensionUri = _context.extensionUri;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = await this._getHtmlForWebview(
      webviewView.webview
    );

    webviewView.onDidChangeVisibility(() => {
      if (this._view.visible) {
        this._view.webview.postMessage({ command: "focus" });
      }
    });

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "chat_request": {
          vscode.commands.executeCommand("sourcery.chat_request", data);
          break;
        }
      }
    });
  }

  public addResult(result) {
    this._view.webview.postMessage({ command: "add_result", result: result });
  }

  public addRecipeMeesage(message) {
    this._view.webview.postMessage({
      command: "recipe_message",
      result: message,
    });
  }

  public clearChat() {
    this._view.webview.postMessage({ command: "clear_chat" });
  }

  private async _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "webview", "chat.js")
    );

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "chat.css")
    );
    const animationsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "animations.css")
    );
    // Use a nonce to only allow a specific script to be run.
    const nonce = randomBytes(16).toString("base64");

    /* eslint-disable @typescript-eslint/naming-convention */
    let cspStr = Object.entries({
      "default-src": "'none'",
      "style-src": `${webview.cspSource + ` 'nonce-${nonce}'`}`,
      "script-src": `'nonce-${nonce}'`,
      "img-src": "* 'self' https:;",
    })
      .map(([key, value]) => {
        return `${key} ${value}`;
      })
      .join("; ");
    /* eslint-enable @typescript-eslint/naming-convention */

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="${cspStr}">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				<link href="${animationsUri}" rel="stylesheet">
			</head>
			<body>
                <section class="sidebar__section-container active" data-section="chat-assistant">
                  <ul class="sidebar__chat-assistant--dialogue-container">
  
                  </ul>
                </section>
                <footer class="sidebar__chat-assistant--footer">
                  <section class="sidebar__chat-assistant--textarea-container">
                    <textarea class="sidebar__chat-assistant--textarea" placeholder="Type your message here!"
                      id="user-prompt"></textarea>
                    <button class="sidebar__chat-assistant--textarea-send-button sidebar__textarea-send-button--disabled"
                      id="send-button">
                      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"
                        class="sidebar__chat-assistant--textarea-send-icon">
                        <path
                          d="m498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6l-119.6-49.7-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1s-20.3-16.7-20.3-29.9v-83.6c0-4 1.5-7.8 4.2-10.7l167.6-182.9c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7l-203.4 180.7-88.3-44.2c-10.6-5.3-17.4-15.9-17.7-27.7s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
                      </svg>
                    </button>
                  </section>
                </footer>
			</body>
			<script nonce="${nonce}" src="${scriptUri}"></script>
			</html>`;
  }
}
