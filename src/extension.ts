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

    const token = workspace.getConfiguration("sourcery").get<string>("token");
    const packageJson = extensions.getExtension('sourcery.sourcery').packageJSON;
    const extensionVersion = packageJson.version;
    const sourceryVersion = packageJson.sourceryVersion;

    //const command = path.join(__dirname, "..", "binaries/sourcery-" + sourceryVersion + "-" + getOperatingSystem());
    const command = "/home/nick/source/sourcery-prototype/run-sourcery.sh";

    const serverOptions: ServerOptions = {
        command,
        args: ['lsp'],
        options: {
            env: {
                PYTHONHASHSEED: "0",
                ...process.env
            }
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: ['python'],
        synchronize: {
            configurationSection: "sourcery"
        },
        initializationOptions: {
            'token': token,
            'editor_version': 'vscode ' + version,
            'extension_version': extensionVersion
        }
    }

    if (!token) {
        const readmePath = Uri.file(
            path.join(context.extensionPath, "INSTALL.py")
        );
        window.showTextDocument(readmePath);
        const result = window.showInputBox({
            placeHolder: 'Sourcery Token',
            prompt: 'Follow the instructions below to get your token.',
            ignoreFocusOut: true
        });
        result.then(function (value) {
            workspace.getConfiguration("sourcery").update('token', value, true)
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

let languageClient: LanguageClient;

export function activate(context: ExtensionContext) {

    const command = 'sourcery.refactor.workspace';

    languageClient = createLangServer(context)

    const commandHandler = (resource: Uri) => {
        let request: ExecuteCommandParams = {
            command: "refactor_workspace",
            arguments: [{
                'uri': resource
            }]
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
    };

    context.subscriptions.push(commands.registerCommand(command, commandHandler));
    context.subscriptions.push(languageClient.start());
}

