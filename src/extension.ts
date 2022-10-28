'use strict';

import * as path from 'path';
import { getExecutablePath } from './executable';

import {
    Uri,
    workspace,
    window,
    ExtensionContext,
    commands,
    version,
    Range,
    ViewColumn,
    TextDocumentShowOptions,
    extensions,
    env,
    StatusBarAlignment, WebviewPanel
} from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    ExecuteCommandRequest,
    ExecuteCommandParams
} from 'vscode-languageclient';
import {readFileSync} from "fs";
import * as vscode from "vscode";
import { getHubSrc } from './hub';


function createLangServer(context: ExtensionContext): LanguageClient {

    const token = workspace.getConfiguration('sourcery').get<string>('token');
    const packageJson = extensions.getExtension('sourcery.sourcery').packageJSON;
    const extensionVersion = packageJson.version;

    const command = getExecutablePath();

    const serverOptions: ServerOptions = {
        command,
        args: ['lsp'],
        options: {
            env: {
                PYTHONHASHSEED: '0',
                ...process.env
            }
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            {language: 'python', scheme: 'file'},
            {language: 'python', scheme: 'untitled'},
            {language: 'python', scheme: 'vscode-notebook-cell' },
            {language: 'yaml', pattern: '**/.sourcery.yaml'}
        ],
        synchronize: {
            configurationSection: 'sourcery'
        },
        initializationOptions: {
            'token': token,
            'editor_version': 'vscode ' + version,
            'extension_version': extensionVersion,
            'telemetry_enabled': env.isTelemetryEnabled
        }
    }

    return new LanguageClient(command, serverOptions, clientOptions);
}

function getValidInput(): string | null {
    const editor = window.activeTextEditor;

    if (editor) {
        const document = editor.document;
        const selection = editor.selection;

        // Get the text within the selection
        let text = document.getText(selection);
        return text;
    }

    return null;
};

export function activate(context: ExtensionContext) {
    const languageClient = createLangServer(context);
    let hubWebviewPanel: WebviewPanel | undefined = undefined;

    context.subscriptions.push(commands.registerCommand('sourcery.welcome.open', () => {
        openWelcomeFile(context);
    }));

    context.subscriptions.push(commands.registerCommand('sourcery.config.create', () => {
        let request: ExecuteCommandParams = {
            command: 'config/create',
            arguments: []
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request).then((values) => {
            openDocument(path.join(workspace.rootPath, '.sourcery.yaml'));
        });
    }));

    context.subscriptions.push(commands.registerCommand('sourcery.rule.create', () => {
        const input = getValidInput();

        let request: ExecuteCommandParams = {
            command: 'config/rule/create',
            arguments: [{'selected': input}]
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request).then((values) => {
            const openPath = Uri.file(path.join(workspace.rootPath, '.sourcery.yaml'));
            workspace.openTextDocument(openPath).then(doc => {
                const opts: TextDocumentShowOptions = {
                    selection: new Range(doc.lineCount - 1, 0, doc.lineCount - 1, 0)
                };
                window.showTextDocument(doc, opts);
            });
        });
    }));

    context.subscriptions.push(commands.registerCommand('sourcery.refactor.workspace', (resource: Uri, selected?: Uri[]) => {
        let request: ExecuteCommandParams = {
            command: 'refactoring/scan',
            arguments: [{
                'uri': resource,
                'all_uris': selected
            }]
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
    }));

    context.subscriptions.push(commands.registerCommand('sourcery.clones.workspace', (resource: Uri, selected?: Uri[]) => {
        let request: ExecuteCommandParams = {
            command: 'clone/scan',
            arguments: [{
                'uri': resource,
                'all_uris': selected
            }]
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
    }));

    // Create the "open hub" command
    // This is activated from the status bar (see below)
    context.subscriptions.push(
      commands.registerCommand("sourcery.hub.open", async () => {
        // Instruct the language server to start the hub server
        // See `core/hub/app` and `core/binary/lsp/sourcery_ls`

      const workspacePath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : "";
        languageClient.sendRequest(ExecuteCommandRequest.type, {
          command: "sourcery.openHub",
          arguments: [{
              "workspacePath": workspacePath
          }],
        });

        // reopen the hub panel if it exists
        // otherwise create it
        if (hubWebviewPanel) {
          hubWebviewPanel.reveal();
        } else {
          // Open a webview panel and fill it with a static empty page
          // The iframe handles loading the actual content
          hubWebviewPanel = window.createWebviewPanel(
            "sourceryhub",
            "Sourcery Hub",
            ViewColumn.Active,
            {
              enableScripts: true,
            }
          );


          hubWebviewPanel.webview.html = getHubSrc();
          hubWebviewPanel.onDidDispose(
            () => {
              hubWebviewPanel = undefined;
            },
            null,
            context.subscriptions
          );
        }
      })
    );

    // Create the status bar
    const myStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    myStatusBarItem.command = "sourcery.hub.open";
    myStatusBarItem.text = "Sourcery";
    myStatusBarItem.tooltip = "Manage Sourcery settings"
    context.subscriptions.push(myStatusBarItem);
    myStatusBarItem.show();

    languageClient.onReady().then(() => {
        languageClient.onNotification('sourcery/vscode/viewProblems', () => {
            commands.executeCommand('workbench.actions.view.problems');
        });

        languageClient.onNotification('sourcery/vscode/accept_recommendation', () => {
            commands.executeCommand('setContext', 'acceptRecommendationContextKey', true);
        });

        languageClient.onNotification('sourcery/vscode/showUrl', (params) => {
            env.openExternal(Uri.parse(params['url']));
        });

        languageClient.onNotification('sourcery/vscode/showSettings', () => {
            commands.executeCommand('workbench.action.openSettings', 'sourcery');
        });

        languageClient.onNotification('sourcery/vscode/showWelcomeFile', () => {
            openWelcomeFile(context);
            const result = window.showInputBox({
                placeHolder: 'Sourcery Token',
                prompt: 'Get advanced Sourcery features by creating a free account and adding your token above. Visit https://sourcery.ai/signup to get started.',
                ignoreFocusOut: true
            });
            result.then(function (value) {
                workspace.getConfiguration('sourcery').update('token', value, true)
            });
        });
    });

    context.subscriptions.push(languageClient.start());
}

function openWelcomeFile(context: ExtensionContext) {
        openDocument(path.join(context.extensionPath, 'welcome-to-sourcery.py'));
}

function openDocument(document_path: string) {
        const openPath = Uri.file(document_path);
        workspace.openTextDocument(openPath).then(doc => {
            window.showTextDocument(doc);
        });
}