import * as vscode from "vscode";
import { randomBytes } from "crypto";
import { ServerRequest } from "./chat";

export type Recipe = {
  id: string;
  name: string;
};

export class RecipeProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "sourcery.recipes";

  private _view?: vscode.WebviewView;

  private _extensionUri: vscode.Uri;

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

    this._view.webview.postMessage({
      command: "add_recipes",
      result: this.recipes,
    });

    webviewView.webview.onDidReceiveMessage(async (request: ServerRequest) => {
      switch (request.type) {
        case "recipe_request": {
          vscode.commands.executeCommand("sourcery.chat_request", request);
          break;
        }
      }
    });
  }

  public addRecipes(result: Recipe[]) {
    this.recipes = result;
  }

  private async _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "webview", "recipes.js")
    );

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
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
        <link href="${animationsUri}" rel="stylesheet">
      </head>
      <body>
          <section class="recipe-section">
          </section>
      </body>
      <script nonce="${nonce}" src="${scriptUri}"></script>
      </html>`;
  }
}
