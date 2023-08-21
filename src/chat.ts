import * as vscode from "vscode";
import { randomBytes } from "crypto";

// TODO: align types between extension and app
export enum ChatResultOutcome {
  Success = "success",
  Error = "error",
  Finished = "finished",
}

export enum ChatResultRole {
  Assistant = "assistant",
  User = "user",
}

export type ChatResult = {
  outcome: ChatResultOutcome;
  textContent: string;
  role: ChatResultRole;
};

export type Recipe = {
  id: string;
  name: string;
};

// Requests forwarded to the (language) server
export type ServerRequest = {
  context_range?: any;
} & (
  | {
      type: "chat/initialiseRequest";
    }
  | {
      type: "chat/clearRequest";
    }
  | {
      type: "chat/messageRequest";
      data: {
        kind: "user_message";
        message: string;
      };
    }
  | {
      type: "chat/cancelRequest";
    }
  | { type: "recipes/initialiseRequest" }
  | {
      type: "recipes/recipeRequest";
      data: {
        kind: "recipe_request";
        name: string;
        id: string;
      };
    }
  | {
      type: "review/reviewRequest";
      data: {
        kind: "review_request";
        main: string;
        current: string;
      };
    }
  | {
      type: "review/initialiseRequest";
    }
  | { type: "review/cancelRequest" }
);

// Requests handled by the extension
export type ExtensionRequest =
  | {
      type: "openLinkRequest";
      linkType: "url" | "file" | "directory";
      link: string;
    }
  | {
      type: "insertAtCursor";
      content: string;
    };

const getNonce = () => randomBytes(16).toString("base64");

export class ChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "sourcery.chat";

  private _view?: vscode.WebviewView;

  private _extensionUri: vscode.Uri;

  private _currentAssistantMessage: string = "";

  private _unhandledMessages: ChatResult[] = [];

  public recipes: Recipe[];

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
        this._view.webview.postMessage({ command: "chat/focus" });
      }
    });

    webviewView.webview.onDidReceiveMessage(
      async (request: ServerRequest | ExtensionRequest) => {
        switch (request.type) {
          case "chat/messageRequest": {
            vscode.commands.executeCommand("sourcery.chat_request", request);
            break;
          }
          case "chat/initialiseRequest": {
            vscode.commands.executeCommand("sourcery.initialise_chat");
            break;
          }
          case "chat/clearRequest": {
            vscode.commands.executeCommand("sourcery.chat.clearChat");
            break;
          }
          case "chat/cancelRequest": {
            vscode.commands.executeCommand("sourcery.chat_cancel_request");
            break;
          }
          case "recipes/recipeRequest": {
            vscode.commands.executeCommand("sourcery.chat_request", request);
            break;
          }
          case "recipes/initialiseRequest": {
            console.log("initialising recipes");
            this._view.webview.postMessage({
              command: "add_recipes",
              result: this.recipes,
            });
            break;
          }
          case "openLinkRequest": {
            if (request.linkType === "url") {
              vscode.env.openExternal(vscode.Uri.parse(request.link));
            } else {
              let path = vscode.Uri.file(request.link);

              // Make the path relative to the workspace root
              if (!request.link.startsWith("/")) {
                const workspaceRoot =
                  vscode.workspace.workspaceFolders?.[0].uri;
                if (workspaceRoot) {
                  path = vscode.Uri.joinPath(workspaceRoot, request.link);
                }
              }

              if (request.linkType === "file") {
                // Open the file in the editor
                vscode.commands.executeCommand("vscode.open", path);
              } else {
                // Reveal the directory in the explorer
                vscode.commands.executeCommand("revealInExplorer", path);
              }
            }
            break;
          }
          case "insertAtCursor": {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
              vscode.window.showErrorMessage("No active text editor!");
              return;
            }

            activeEditor.edit((editBuilder) => {
              // Thank you coding assistant!
              if (!activeEditor.selection.isEmpty) {
                editBuilder.replace(activeEditor.selection, request.content);
              } else {
                editBuilder.insert(
                  activeEditor.selection.active,
                  request.content
                );
              }
            });
          }
        }
      }
    );

    while (this._unhandledMessages.length > 0) {
      const message = this._unhandledMessages.shift();
      this.addResult(message);
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
      command: "chat/addResult",
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
      this._view.webview.postMessage({ command: "chat/assistantFinished" });
      return;
    }

    if (result.outcome === ChatResultOutcome.Success) {
      this._currentAssistantMessage += result.textContent;
    } else {
      this._currentAssistantMessage = result.textContent;
    }

    this._view.webview.postMessage({
      command: "chat/addResult",
      result: {
        role: result.role,
        outcome: result.outcome,
        textContent: result.textContent,
      },
    });
  }

  public addRecipes(result: Recipe[]) {
    this.recipes = result;
    this._view.webview.postMessage({
      command: "recipes/addRecipes",
      result: result,
    });
  }

  public clearChat() {
    this._view.webview.postMessage({ command: "chat/clear" });
    this._currentAssistantMessage = "";
  }

  private async _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const baseSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "resources",
        "webview",
        "index.html"
      )
    );
    const scriptSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "resources",
        "webview",
        "assets",
        "index.js"
      )
    );
    const scriptNonce = getNonce();
    const scriptTag = `<script type="module" nonce="${scriptNonce}" src="${scriptSrc}"></script>`;
    const injectNonce = getNonce();

    const bridgeSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "ide-styles.css")
    );

    const styleSheetSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "resources",
        "webview",
        "assets",
        "index.css"
      )
    );
    // language=html
    return `<!doctype html>
<html lang="en">
  <head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${scriptNonce}' 'nonce-${injectNonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
	<base href="${baseSrc}" />
	<link rel="stylesheet" href="${bridgeSrc}">
	<link rel="stylesheet" href="${styleSheetSrc}">
  </head>
  <body style="height: 100vh;">
    <div id="root" style="height: 100%;"></div>
	${scriptTag}
  <script nonce=${injectNonce}>
    (function () {
      const vscode = acquireVsCodeApi();
      window.sourceryLS = {
        postMessage: vscode.postMessage,
      };
    }())
  </script>
  </body>
</html>
`;
  }
}
