import * as vscode from 'vscode';

export class RuleInputProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'sourcery.rules';

	private _view?: vscode.WebviewView;

	private _extensionUri: vscode.Uri;

	constructor(
		private _context: vscode.ExtensionContext,
	) {
		this._extensionUri = _context.extensionUri;
	}


	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);
		let documents = vscode.window.visibleTextEditors.map(editor => editor.document.uri.fsPath);
		webviewView.webview.onDidReceiveMessage(async data => {
			switch (data.type) {
				case "scanForPattern": {
					vscode.commands.executeCommand("sourcery.scan.rule", documents, data.pattern, data.replacement, data.condition, false);
					break;
				}
				case "replacePattern": {
					vscode.commands.executeCommand("sourcery.scan.rule", documents, data.pattern, data.replacement, data.condition, true);
					break;
				}
				case "savePattern": {
					vscode.commands.executeCommand("sourcery.rule.create", data.pattern, data.replacement, data.condition);
					break;
				}
			}
		});
	}

	private async _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		/* eslint-disable @typescript-eslint/naming-convention */
		let cspStr = Object.entries({
			"default-src": "'none'",
			"style-src": `${webview.cspSource + ` 'nonce-${nonce}'`}`,
			"script-src": `'nonce-${nonce}'`,
			"img-src": "* 'self' https:;"
		}).map(([key, value]) => {
			return `${key} ${value}`;
		}).join('; ');
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
			</head>
			<body>
				<label for="patternInput">Pattern</label>
				<textarea
					class="patternInput""
					placeholder="Enter your pattern here...."
					nonce="${nonce}"
				></textarea>
				<label for="replacementInput">Replacement</label>
				<textarea
					class="replacementInput""
					placeholder="Enter your replacement here...."
					nonce="${nonce}"
				></textarea>
				<label for="conditionInput">Condition</label>
				<textarea
					class="conditionInput""
					placeholder="Enter your condition here...."
					nonce="${nonce}"
				></textarea>
				<div class="btnContainer">
					<button class="scanner-button"}>Scan</button>
				</div>
				<div class="btnContainer">
					<button class="replace-button" disabled}>Replace</button>
				</div>
				<div class="btnContainer">
					<button class="save-button"}>Save as Rule</button>
				</div>
			</body>
			<script nonce="${nonce}" src="${scriptUri}"></script>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}