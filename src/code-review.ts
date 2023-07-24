import * as vscode from "vscode";
import { randomBytes } from "crypto";
import {
  ChatProvider,
  ChatRequest,
  ChatResult,
  ChatResultRole,
  ChatResultOutcome,
  renderAssistantMessage,
  CancelRequest,
} from "./chat";

import { ColorThemeKind } from "vscode";

export class CodeReviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "sourcery.code_review";

  private _view?: vscode.WebviewView;
  private _currentAssistantMessage: string = "";

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

    webviewView.webview.onDidReceiveMessage(
      async (request: ChatRequest | CancelRequest) => {
        switch (request.type) {
          case "review_request": {
            vscode.commands.executeCommand("sourcery.review_request", request);
            break;
          }
          case "cancel_request": {
            vscode.commands.executeCommand("sourcery.review_cancel_request");
            break;
          }
        }
      }
    );
  }

  public addResult(result: ChatResult) {
    if (this._view) {
      if (result.role === ChatResultRole.User) {
        this.addUserResult(result);
      } else {
        this.addAssistantResult(result);
      }
    }
  }

  private addUserResult(result: ChatResult) {
    this._view.webview.postMessage({
      command: "add_result",
      result: {
        role: result.role,
        outcome: result.outcome,
        textContent: result.textContent,
      },
    });
  }

  private addAssistantResult(result: ChatResult) {
    if (result.outcome === ChatResultOutcome.Finished) {
      this._currentAssistantMessage = "";
      this._view.webview.postMessage({ command: "assistant_finished" });
      return;
    }

    if (result.outcome === ChatResultOutcome.Success) {
      this._currentAssistantMessage += result.textContent;
    } else {
      this._currentAssistantMessage = result.textContent;
    }

    let sanitized = renderAssistantMessage(this._currentAssistantMessage);

    this._view.webview.postMessage({
      command: "add_result",
      result: {
        role: result.role,
        outcome: result.outcome,
        textContent: sanitized,
      },
    });
  }

  public clear() {
    this._view.webview.postMessage({ command: "clear_chat" });
    this._currentAssistantMessage = "";
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
    let hljsUri;
    if (vscode.window.activeColorTheme.kind === ColorThemeKind.Light) {
      hljsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "media", "github.min.css")
      );
    } else {
      hljsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "media", "github-dark.min.css")
      );
    }
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
			<html lang="en" xmlns="http://www.w3.org/1999/html">
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
        <link href="${hljsUri}" rel="stylesheet">

			</head>
			<body class="sidebar__chat-assistant-body">
        <section class="review-button-section">
            <div class="btnContainer">
                <button class="review-button" >Review My Code</button>
            </div>
        </section>
        <section id="message-container" class="sidebar__section-container active" data-section="chat-assistant">
        <ul class="sidebar__chat-assistant--dialogue-container">
            <li id="anchor"></li>
        </ul>
        </section>
			</body>
            <footer class="sidebar__chat-assistant--footer">
            <section class="sidebar__chat-assistant--textarea-container">
            <button id="cancel-button" class="sidebar__chat-assistant--cancel-button" disabled>
                <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="sidebar__chat-assistant--regenerate-button-icon">
                    <path d="m464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zm-464 0a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm224-72v144c0 13.3-10.7 24-24 24s-24-10.7-24-24v-144c0-13.3 10.7-24 24-24s24 10.7 24 24zm112 0v144c0 13.3-10.7 24-24 24s-24-10.7-24-24v-144c0-13.3 10.7-24 24-24s24 10.7 24 24z"></path>
                </svg>
                <span>Cancel</span>
            </button>
            </section>
          </footer>
			<script nonce="${nonce}" src="${scriptUri}"></script>
			</html>`;
  }
}
