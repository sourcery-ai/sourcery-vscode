'use strict';

import * as path from 'path';
import {Uri, workspace, window, Disposable, ExtensionContext, commands, version, extensions} from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    RequestType,
    ExecuteCommandRequest,
    ExecuteCommandParams
} from 'vscode-languageclient';


const REFACTOR_WORKSPACE_REQUEST = new RequestType('refactor_workspace');

function createLangServer(context: ExtensionContext): LanguageClient {

    const token = workspace.getConfiguration('sourcery').get<string>('token');
    const packageJson = extensions.getExtension('sourcery.sourcery').packageJSON;
    const extensionVersion = packageJson.version;
    const sourceryVersion = packageJson.sourceryVersion;

    const command = path.join(__dirname, "..", "binaries/sourcery-" + sourceryVersion + "-" + getOperatingSystem());

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
        documentSelector: ['python'],
        synchronize: {
            configurationSection: 'sourcery'
        },
        initializationOptions: {
            'token': token,
            'editor_version': 'vscode ' + version,
            'extension_version': extensionVersion
        }
    }

    if (!token) {
        const readmePath = Uri.file(
            path.join(context.extensionPath, 'welcome-to-sourcery.py')
        );
        window.showTextDocument(readmePath);
        const result = window.showInputBox({
            placeHolder: 'Sourcery Token',
            prompt: 'Follow the instructions below to get your token.',
            ignoreFocusOut: true
        });
        result.then(function (value) {
            workspace.getConfiguration('sourcery').update('token', value, true)
        });
    }

    return new LanguageClient(command, serverOptions, clientOptions);
}


function getOperatingSystem(): string {
    if (process.platform == 'win32') {
        return 'win/sourcery.exe'
    } else if (process.platform == 'darwin') {
        return 'mac/sourcery'
    } else {
        // Assume everything else is linux compatible
        return 'linux/sourcery'
    }
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

    context.subscriptions.push(languageClient.start());
}

