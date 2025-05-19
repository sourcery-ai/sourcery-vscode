import * as vscode from "vscode";
import { randomBytes } from "crypto";
import { getCodingAssistantAssetsPath } from "./executable";
import * as path from "path";

export type Recipe = {
  id: string;
  name: string;
};

type DocumentPosition = {
  line: number;
  character: number;
};

type DocumentRange = {
  start: DocumentPosition;
  end: DocumentPosition;
};

// Requests handled by the extension
export type ExtensionMessage =
  | {
      target: "extension";
      request: "openLink";
      linkType: "url" | "file" | "directory";
      link: string;
      documentRange: DocumentRange | null;
    }
  | {
      target: "extension";
      request: "copyToClipboard";
      content: string;
    }
  | {
      target: "extension";
      request: "insertAtCursor";
      content: string;
    }
  | {
      target: "extension";
      request: "updateConfiguration";
      section: "sourcery.codeLens";
      value: boolean;
      // https://code.visualstudio.com/api/references/vscode-api#ConfigurationTarget
      configurationTarget: vscode.ConfigurationTarget;
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
  private _panel?: vscode.WebviewPanel; // Track the current panel

  public recipes: Recipe[] = []; // this data is used in the "Ask Sourcery" command prompt, so can't be removed

  constructor(private _context: vscode.ExtensionContext) {
    this._extensionUri = _context.extensionUri;
    const _assetsPath = getCodingAssistantAssetsPath();
    // Parsing the path using `file` rather than `parse` allows it to work on Windows
    // See https://github.com/microsoft/vscode-uri/blob/5af89bac2109c0dc7f904b20cc88cac0568747b1/src/uri.ts#L309-L311
    this._assetsUri = vscode.Uri.file(_assetsPath);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    console.log(
      `Initialising webview. Assets URI: ${this._assetsUri}; Extension URI: ${this._extensionUri}`
    );

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
              case "copyToClipboard": {
                this.handleCopyToClipboardRequest(message);
                break;
              }
              case "insertAtCursor": {
                this.handleInsertAtCursorRequest(message);
                break;
              }
              case "updateConfiguration": {
                await vscode.workspace
                  .getConfiguration()
                  .update(
                    message.section,
                    message.value,
                    message.configurationTarget
                  );
              }
            }
        }
      }
    );
  }

  /**
   * Creates a new webview panel with chat functionality or reveals an existing one
   */
  public async createOrShowWebviewPanel(): Promise<vscode.WebviewPanel> {
    if (this._panel) {
      // If panel already exists, reveal it
      this._panel.reveal();
      return this._panel;
    }

    // Create a new panel
    const panel = vscode.window.createWebviewPanel(
      "sourceryChatPanel", // Unique identifier
      "Analytics", // Title
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this._extensionUri, this._assetsUri],
      }
    );

    // Set the panel's HTML content
    panel.webview.html = await this._getHtmlForWebview(panel.webview);

    // Set up message handling
    panel.webview.onDidReceiveMessage(
      async ({ message, ...rest }: { message: OutboundMessage }) => {
        switch (message.target) {
          case "languageServer":
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
              case "copyToClipboard": {
                this.handleCopyToClipboardRequest(message);
                break;
              }
              case "insertAtCursor": {
                this.handleInsertAtCursorRequest(message);
                break;
              }
              case "updateConfiguration": {
                await vscode.workspace
                  .getConfiguration()
                  .update(
                    message.section,
                    message.value,
                    message.configurationTarget
                  );
              }
            }
        }
      }
    );

    // Track this panel and handle disposal
    this._panel = panel;
    panel.onDidDispose(() => {
      this._panel = undefined;
    });

    return panel;
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

    // Send to the sidebar view if it exists
    if (this._view?.webview) {
      this._view.webview.postMessage(command);
    }

    // Also send to the panel if it exists
    if (this._panel?.webview) {
      switch (command.command) {
        case "context/update": {
          command["updates"]["isAnalyticsPanel"] = true;
          break;
        }
      }
      this._panel.webview.postMessage(command);
    }
  }

  private handleOpenLinkRequest({
    link,
    linkType,
    documentRange,
  }: {
    target: "extension";
    request: "openLink";
    linkType: "url" | "file" | "directory";
    link: string;
    documentRange: DocumentRange | null;
  }) {
    if (linkType === "url") {
      vscode.env.openExternal(vscode.Uri.parse(link));
    } else {
      let filePath = vscode.Uri.file(link);
      // Make the path relative to the workspace root
      if (!path.isAbsolute(link)) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
        if (workspaceRoot) {
          filePath = vscode.Uri.joinPath(workspaceRoot, link);
        }
      }

      if (linkType === "file") {
        // Open the file in the editor
        vscode.workspace.openTextDocument(filePath).then((doc) => {
          vscode.window.showTextDocument(doc).then((editor) => {
            if (documentRange) {
              editor.selection = new vscode.Selection(
                documentRange.start.line,
                documentRange.start.character,
                documentRange.end.line,
                documentRange.end.character
              );
              editor.revealRange(
                editor.selection,
                vscode.TextEditorRevealType.InCenter
              );
            }
          });
        });
      } else {
        // Reveal the directory in the explorer
        vscode.commands.executeCommand("revealInExplorer", filePath).then(() =>
          // This is a little hack.
          //
          // There's some issue with the revealInExplorer command which means when the panel changes
          // (e.g. from sourcery to the explorer) the instruction to actually focus the file path
          // seems to get dropped. By calling it again (after the first command succeeds) we can
          // make sure the file actually gets navigated to.
          vscode.commands.executeCommand("revealInExplorer", filePath)
        );
      }
    }
  }

  private handleCopyToClipboardRequest({
    content,
  }: {
    target: "extension";
    request: "copyToClipboard";
    content: string;
  }) {
    vscode.env.clipboard.writeText(content);
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
    <div id="root" style="height: 100%; overflow-y: hidden;"></div>
    <script type="module" nonce="${appScriptNonce}" src="${appScriptSrc}"></script>
    <script nonce=${apiInjectionNonce}>
      (function () {
        const vscode = acquireVsCodeApi();
        window.sourceryLS = {
          postMessage: vscode.postMessage,
        };

        const updateTheme = () => {
          // The theme class can be vscode-light, vscode-dark, vscode-high-contrast and only
          // vscode-light is a light theme. The others are dark themes
          const theme = document.body.classList.contains("vscode-light") ? "light" : "dark";

          // Set the theme class on the document element so that the webview can style itself
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(theme);
        };
        updateTheme();
        new MutationObserver(updateTheme).observe(document.body, {attributes: true});
      }())
    </script>
  </body>
</html>
`;
  }
}
