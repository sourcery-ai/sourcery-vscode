'use strict';

import * as path from 'path';
import * as fs from 'fs';
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

    //const command = path.join(__dirname, "..", "sourcery_binaries/" + getExecutablePath());
    const command = "/home/nick/source/sourcery-prototype/run-sourcery.sh";

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



function getExecutablePath(): string {
    const activePath = path.join(__dirname, "..", "sourcery_binaries/active");
    if (fs.existsSync(activePath)) {
        if (process.platform == 'win32') {
            return 'active/sourcery.exe'
        } else if (process.platform == 'darwin') {
            return 'active/sourcery'
        } else {
            // Assume everything else is linux compatible
            return 'active/sourcery'
        }
    } else {
        if (process.platform == 'win32') {
            return 'install/win/sourcery.exe'
        } else if (process.platform == 'darwin') {
            return 'install/mac/sourcery'
        } else {
            // Assume everything else is linux compatible
            return 'install/linux/sourcery'
        }
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

