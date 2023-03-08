'use strict';

import * as path from 'path';
import {getExecutablePath} from './executable';

import * as vscode from 'vscode';
import {
    commands,
    env,
    ExtensionContext,
    extensions,
    Range,
    StatusBarAlignment,
    TextDocumentShowOptions,
    TextEditorRevealType, TreeItem, TreeView,
    Uri,
    version,
    ViewColumn,
    WebviewPanel,
    window,
    workspace
} from 'vscode';
import {
    ExecuteCommandParams,
    ExecuteCommandRequest,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient';
import {getHubSrc} from './hub';
import {RuleInputProvider} from "./rule-search"
import {ScanResultProvider} from "./rule-search-results";

function createLangServer(): LanguageClient {

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
            {language: 'javascript', scheme: 'file'},
            {language: 'typescript', scheme: 'file'},
            {language: 'javascriptreact', scheme: 'file'},
            {language: 'typescriptreact', scheme: 'file'},
            {language: 'python', scheme: 'untitled'},
            {language: 'python', scheme: 'vscode-notebook-cell' },
            {language: 'yaml', pattern: '**/.sourcery.yaml'},
            {language: 'yaml', pattern: '**/sourcery.yaml'}
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

function showSourceryStatusBarItem(context: ExtensionContext) {
    // Create the status bar
    const myStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    myStatusBarItem.command = "sourcery.hub.start";
    myStatusBarItem.text = "Sourcery";
    myStatusBarItem.tooltip = "Manage Sourcery settings"
    context.subscriptions.push(myStatusBarItem);
    myStatusBarItem.show();
}

function registerNotifications(languageClient: LanguageClient, tree: ScanResultProvider, treeView: TreeView<TreeItem>, context: ExtensionContext) {
    languageClient.onNotification('sourcery/vscode/executeCommand', (params) => {
        const command = params['command']
        const args = params['arguments'] || []
        commands.executeCommand(command, ...args)
    });

    languageClient.onNotification('sourcery/vscode/scanResults', (params) => {
        if (params.diagnostics.length > 0) {
            tree.update(params);
        }
        treeView.title = "Results - " + params.results + " found in " + params.files + " files."
    });

    languageClient.onNotification('sourcery/vscode/viewProblems', () => {
        commands.executeCommand('workbench.actions.view.problems');
    });

    languageClient.onNotification('sourcery/vscode/accept_recommendation', () => {
        commands.executeCommand('setContext', 'acceptRecommendationContextKey', true);
    });


    languageClient.onNotification('sourcery/vscode/showUrl', (params) => {
        env.openExternal(Uri.parse(params['url']));
    });


    languageClient.onNotification('sourcery/vscode/showWelcomeFile', () => {
        openWelcomeFile(context);
    });
}

function registerCommands(context: ExtensionContext, riProvider: RuleInputProvider, languageClient: LanguageClient, tree: ScanResultProvider, treeView: TreeView<TreeItem>, hubWebviewPanel: WebviewPanel) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            RuleInputProvider.viewType, riProvider, {webviewOptions: {retainContextWhenHidden: true}}
        )
    );

    context.subscriptions.push(commands.registerCommand('sourcery.selectCode', (open_uri, start, end) => {
        workspace.openTextDocument(open_uri).then(doc => {
            window.showTextDocument(doc).then(e => {
                e.selection = new vscode.Selection(start, end);
                e.revealRange(new Range(start, end), TextEditorRevealType.InCenter);
            })
        });

    }));

    context.subscriptions.push(commands.registerCommand('sourcery.scan.toggleAdvanced', () => {
        // Tell the rules webview to toggle
        riProvider.toggle();
    }));

    context.subscriptions.push(commands.registerCommand('sourcery.scan.applyRule', (entry) => {
        workspace.openTextDocument(entry.resourceUri).then(doc => {
            window.showTextDocument(doc).then(e => {
                e.revealRange(new Range(entry.startPosition, entry.endPosition), TextEditorRevealType.InCenter);
                for (let edit of entry.edits) {
                    const workspaceEdit = new vscode.WorkspaceEdit();

                    const textEdit = new vscode.TextEdit(new vscode.Range(edit.range.start.line, edit.range.start.character, edit.range.end.line, edit.range.end.character), edit.newText);

                    // Apply the edit to the current workspace
                    workspaceEdit.set(entry.resourceUri, [textEdit]);

                    workspace.applyEdit(workspaceEdit);
                }
            })
        });

    }));

    context.subscriptions.push(commands.registerCommand('sourcery.welcome.open', () => {
        openWelcomeFile(context);
    }));

    context.subscriptions.push(commands.registerCommand('sourcery.scan.open', () => {
        vscode.commands.executeCommand('setContext',
            'sourceryRulesActive',
            true);
        vscode.commands.executeCommand("sourcery.rules.focus")
    }));

    context.subscriptions.push(commands.registerCommand('sourcery.walkthrough.open', () => {
        openWelcomeFile(context);
        commands.executeCommand('workbench.action.openWalkthrough', 'sourcery.sourcery#sourcery.walkthrough', true);
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

    context.subscriptions.push(commands.registerCommand('sourcery.rule.create', (pattern?: string, replacement?: string, condition?: string) => {
        let input;
        if (typeof pattern !== 'undefined') {
            input = pattern;
        } else {
            input = getValidInput();
        }

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

    context.subscriptions.push(commands.registerCommand('sourcery.scan.rule', (rule, advanced: boolean, inplace: boolean, language: string) => {
        if (inplace) {
            vscode.window
                .showInformationMessage("Are you sure?", "Yes", "No")
                .then(answer => {
                    if (answer === "Yes") {
                        runScan(rule, advanced, inplace, language);
                    }
                })
        } else {
            runScan(rule, advanced, inplace, language);
        }

    }));

    function runScan(rule, advanced: boolean, inplace: boolean, language: string) {
        tree.clear();
        treeView.title = "Results";
        let request: ExecuteCommandParams = {
            command: 'rule/scan',
            arguments: [{
                'rule': rule,
                'advanced': advanced,
                'inplace': inplace,
                "language": language
            }]
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
    }

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
        commands.registerCommand("sourcery.hub.start", async () => {
            // Instruct the language server to start the hub server
            // See `core/hub/app` and `core/binary/lsp/sourcery_ls`

            languageClient.sendRequest(ExecuteCommandRequest.type, {
                command: "sourcery.startHub",
                arguments: [],
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
}

export function activate(context: ExtensionContext) {
    const languageClient = createLangServer();
    let hubWebviewPanel: WebviewPanel | undefined = undefined;

    let tree = new ScanResultProvider();

    let treeView = vscode.window.createTreeView('sourcery.rules.treeview', {
      treeDataProvider: tree
    });

    const riProvider = new RuleInputProvider(
        context,
	);
    registerCommands(context, riProvider, languageClient, tree, treeView, hubWebviewPanel);

    showSourceryStatusBarItem(context);

    languageClient.onReady().then(() => {
        registerNotifications(languageClient, tree, treeView, context);
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
