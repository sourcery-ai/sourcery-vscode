'use strict';

import * as path from 'path';
import { getExecutablePath } from './executable';

import { Uri, workspace, window, Disposable, ExtensionContext, commands, version, extensions, env } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    RequestType,
    ExecuteCommandRequest,
    ExecuteCommandParams
} from 'vscode-languageclient';
import { allowedNodeEnvironmentFlags } from 'process';


const REFACTOR_WORKSPACE_REQUEST = new RequestType('refactor_workspace');

function createLangServer(context: ExtensionContext): LanguageClient {

    const token = workspace.getConfiguration('sourcery').get<string>('token');
    const packageJson = extensions.getExtension('sourcery.sourcery').packageJSON;
    const extensionVersion = packageJson.version;

    const command = path.join(__dirname, "..", "sourcery_binaries/" + getExecutablePath());
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
        documentSelector: [{language: 'python', scheme: 'file'}, {language: 'python', scheme: 'untitled'},
            { scheme: 'vscode-notebook-cell', language: 'python' }],
        synchronize: {
            configurationSection: 'sourcery'
        },
        initializationOptions: {
            'token': token,
            'editor_version': 'vscode ' + version,
            'extension_version': extensionVersion
        }
    }

    return new LanguageClient(command, serverOptions, clientOptions);
}
export function activate(context: ExtensionContext) {
    const languageClient = createLangServer(context)

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

    context.subscriptions.push(commands.registerCommand('sourcery.level.toggle', () => {
        let request: ExecuteCommandParams = {
            command: 'refactoring/toggle_level',
            arguments: []
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
    }));

    languageClient.onReady().then(() => {
        languageClient.onNotification('sourcery/vscode/viewProblems', () => {
            commands.executeCommand('workbench.actions.view.problems');
        });

        languageClient.onNotification('sourcery/vscode/showUrl', (params) => {
            env.openExternal(Uri.parse(params['url']));
        });

        languageClient.onNotification('sourcery/vscode/showSettings', () => {
            commands.executeCommand('workbench.action.openSettings', 'sourcery');
        });

        languageClient.onNotification('sourcery/vscode/showWelcomeFile', () => {
            const readmePath = Uri.file(
                path.join(context.extensionPath, 'welcome-to-sourcery.py')
            );
            window.showTextDocument(readmePath);
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

