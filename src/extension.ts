'use strict';

import * as path from 'path';
import {workspace, Disposable, ExtensionContext, version, extensions} from 'vscode';
import {LanguageClient, LanguageClientOptions, ServerOptions} from 'vscode-languageclient';

function startLangServer(args: string[], documentSelector: string[]): Disposable {

    const token = workspace.getConfiguration("sourcery").get<string>("token");
    const packageJson = extensions.getExtension('sourcery.sourcery').packageJSON;
    const extensionVersion = packageJson.version;
    const sourceryVersion = packageJson.sourceryVersion;

    const command = path.join(__dirname, "..", "binaries/sourcery-" + sourceryVersion + "-" + getOperatingSystem());

    const serverOptions: ServerOptions = {
        command,
        args,
    };
    const clientOptions: LanguageClientOptions = {
        documentSelector: documentSelector,
        synchronize: {
            configurationSection: "sourcery.token"
        },
        initializationOptions: {
            'token': token,
            'vscode_version': 'vscode ' + version,
            'extension_version': extensionVersion
        }
    }


    return new LanguageClient(command, serverOptions, clientOptions).start();
}

function getOperatingSystem(): string {
    if (process.platform == 'win32') {
        return 'win/sourcery.exe'
    } else if (process.platform == 'darwin') {
        return 'mac/sourcery'
    } else if (process.platform == 'linux') {
        return 'linux/sourcery'
    } else {
        throw new Error(`Sorry, the platform '${process.platform}' is not supported by Sourcery.`)
    }
}

export function activate(context: ExtensionContext) {
    context.subscriptions.push(startLangServer(["--lsp"], ["python"]));
}

