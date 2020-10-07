'use strict';

import * as path from 'path';
import {Uri, workspace, window, Disposable, ExtensionContext, version, extensions} from 'vscode';
import {LanguageClient, LanguageClientOptions, ServerOptions} from 'vscode-languageclient';

function startLangServer(context: ExtensionContext): Disposable {
    const token = workspace.getConfiguration("sourcery").get<string>("token");
    const packageJson = extensions.getExtension('sourcery.sourcery').packageJSON;
    const extensionVersion = packageJson.version;
    const sourceryVersion = packageJson.sourceryVersion;

    const command = path.join(__dirname, "..", "binaries/sourcery-" + sourceryVersion + "-" + getOperatingSystem());

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


    return new LanguageClient(command, serverOptions, clientOptions).start();
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
    context.subscriptions.push(startLangServer(context));
}

