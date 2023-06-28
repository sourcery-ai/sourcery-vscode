import * as vscode from "vscode";
import { ColorThemeKind } from "vscode";
import { randomBytes } from "crypto";
import { marked } from "marked";
import hljs from "highlight.js";
import { markedHighlight } from "marked-highlight";
import sanitizeHtml from "sanitize-html";

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlightAuto(code).value;
    },
  })
);

enum ChatResultOutcome {
  Success = "success",
  Error = "error",
  Finished = "finished",
}

enum ChatResultRole {
  Assistant = "assistant",
  User = "user",
}

type ChatResult = {
  outcome: ChatResultOutcome;
  textContent: string;
  role: ChatResultRole;
};

export type ChatRequestData = {
  kind: "user_message";
  message: string;
};

export type RecipeRequestData = {
  kind: "recipe_request";
  name: string;
  id: string;
};

export type ChatRequest = {
  type: "recipe_request" | "chat_request";
  data: ChatRequestData | RecipeRequestData;
  context_range?: any;
};

export class ChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "sourcery.chat";

  private _view?: vscode.WebviewView;

  private _extensionUri: vscode.Uri;

  private _currentAssistantMessage: string = "";

  private _unhandledMessages: ChatResult[] = [];

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

    webviewView.webview.onDidReceiveMessage(async (data: ChatRequest) => {
      switch (data.type) {
        case "chat_request": {
          vscode.commands.executeCommand("sourcery.chat_request", data);
          break;
        }
      }
    });
    if (this._unhandledMessages.length === 0) {
      vscode.commands.executeCommand("sourcery.initialise_chat");
    } else {
      while (this._unhandledMessages.length > 0) {
        const message = this._unhandledMessages.shift();
        this.addResult(message);
      }
    }
  }

  public addResult(result: ChatResult) {
    if (this._view) {
      if (result.role === ChatResultRole.User) {
        this.addUserResult(result);
      } else {
        this.addAssistantResult(result);
      }
    } else {
      this._unhandledMessages.push(result);
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

    let sanitized = this.renderAssistantMessage(this._currentAssistantMessage);

    this._view.webview.postMessage({
      command: "add_result",
      result: {
        role: result.role,
        outcome: result.outcome,
        textContent: sanitized,
      },
    });
  }

  private renderAssistantMessage(message: string) {
    // Send the whole message we've been streamed so far to the webview,
    // after converting from markdown to html

    const rendered = marked(message, {
      gfm: true,
      breaks: true,
      mangle: false,
      headerIds: false,
    });

    // Allow any classes on span and code blocks or highlightjs classes get removed
    return sanitizeHtml(rendered, {
      allowedClasses: { span: false, code: false },
    });
  }

  public clearChat() {
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
				<link href="${hljsUri}" rel="stylesheet">

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
