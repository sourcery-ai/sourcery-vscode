import * as vscode from "vscode";
import { randomBytes } from "crypto";
import { getCodingAssistantAssetsPath } from "./executable";

export type Recipe = {
  id: string;
  name: string;
};

// Requests handled by the extension
export type ExtensionMessage =
  | {
      target: "extension";
      request: "openLink";
      linkType: "url" | "file" | "directory";
      link: string;
    }
  | {
      target: "extension";
      request: "insertAtCursor";
      content: string;
    };

type LanguageServerMessage = {
  target: "languageServer";
  // don't care about additional fields
};

type OutboundMessage = LanguageServerMessage | ExtensionMessage;

const getNonce = () => randomBytes(16).toString("base64");

export class ChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "sourcery.chat";

  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _assetsUri: vscode.Uri;

  public recipes: Recipe[] = []; // this data is used in the "Ask Sourcery" command prompt, so can't be removed

  constructor(private _context: vscode.ExtensionContext) {
    this._extensionUri = _context.extensionUri;
    this._assetsUri = vscode.Uri.parse(getCodingAssistantAssetsPath());
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
      localResourceRoots: [this._extensionUri, this._assetsUri],
    };

    webviewView.webview.html = await this._getHtmlForWebview(
      webviewView.webview
    );

    webviewView.webview.onDidReceiveMessage(
      async ({ message, ...rest }: { message: OutboundMessage }) => {
        switch (message.target) {
          case "languageServer":
            // Language server requests are passed onwards without further changes.
            // Note: the command (registered in extension.ts) attaches additional workspace context.
            vscode.commands.executeCommand("sourcery.coding_assistant", {
              message,
              ...rest,
            });
            break;
          case "extension":
            switch (message.request) {
              case "openLink":
                this.handleOpenLinkRequest(message);
                break;
              case "insertAtCursor": {
                this.handleInsertAtCursorRequest(message);
                break;
              }
            }
        }
      }
    );
  }

  public postCommand(command: any) {
    // Intercept the addRecipes command
    // The "Ask Sourcery" user interface needs to have the recipes available
    // and gets them from this class. When the update comes in, we add them to
    // the class before forwarding into the web view.
    switch (command.command) {
      case "recipes/addRecipes": {
        this.recipes = command.recipes;
        break;
      }
    }
    this._view.webview.postMessage(command);
  }

  private handleOpenLinkRequest({
    link,
    linkType,
  }: {
    target: "extension";
    request: "openLink";
    linkType: "url" | "file" | "directory";
    link: string;
  }) {
    if (linkType === "url") {
      vscode.env.openExternal(vscode.Uri.parse(link));
    } else {
      let path = vscode.Uri.file(link);

      // Make the path relative to the workspace root
      if (!link.startsWith("/")) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
        if (workspaceRoot) {
          path = vscode.Uri.joinPath(workspaceRoot, link);
        }
      }

      if (linkType === "file") {
        // Open the file in the editor
        vscode.commands.executeCommand("vscode.open", path);
      } else {
        // Reveal the directory in the explorer
        vscode.commands.executeCommand("revealInExplorer", path);
      }
    }
  }

  private handleInsertAtCursorRequest({
    content,
  }: {
    target: "extension";
    request: "insertAtCursor";
    content: string;
  }) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showErrorMessage("No active text editor!");
      return;
    }

    activeEditor.edit((editBuilder) => {
      // Thank you coding assistant!
      if (!activeEditor.selection.isEmpty) {
        editBuilder.replace(activeEditor.selection, content);
      } else {
        editBuilder.insert(activeEditor.selection.active, content);
      }
    });
  }

  // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
  private async _getHtmlForWebview(webview: vscode.Webview) {
    // The baseSrc is just a URI declaring the root of the web app.
    // This is relevant for the interaction between the script and the stylesheet.
    // It is used in the `<base>` tag below - see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
    // This is a synthetic URI and doesn't need to refer to an actual file.
    const baseSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(this._assetsUri, "..", "index.html")
    );

    // This is the URI to the main application script.
    // We bundle this as a single javascript file and inject it directly into the HTML below, alongside the random nonce.
    // Note that we also include a hard-coded script to attach the VSCode API directly to the window.
    const appScriptSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(this._assetsUri, "index.js")
    );

    // This is the URI to the main application CSS file.
    // These are styles and themes handled by the web app itself.
    // We need to provide some additional CSS, using the `ide-styles.css` file below.
    // This is to ensure the web app's style matches that of the IDE.
    const appStylesSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(this._assetsUri, "index.css")
    );

    // This is the URI to the IDE styles.
    // This should be bundled as part of the extension (rather than the web app) and defines several colours to get the web app to match the IDE style.
    const ideStylesSrc = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "ide-styles.css")
    );

    const appScriptNonce = getNonce();
    const apiInjectionNonce = getNonce();

    // language=html
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${appScriptNonce}' 'nonce-${apiInjectionNonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sourcery</title>
    <base href="${baseSrc}" />
    <link rel="stylesheet" href="${ideStylesSrc}">
    <link rel="stylesheet" href="${appStylesSrc}">
  </head>
  <body style="height: 100vh;">
    <div id="root" style="height: 100%;"></div>
    <script type="module" nonce="${appScriptNonce}" src="${appScriptSrc}"></script>
    <script nonce=${apiInjectionNonce}>
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
