'use strict';

import * as path from 'path';
import {Uri, workspace, window, Disposable, ExtensionContext, commands, version, extensions} from 'vscode';
const { exec } = require('child_process');
import * as fs from 'fs';

//const command = path.join(__dirname, "..", "sourcery_binaries/" + getExecutablePath());

const command = "/home/nick/source/sourcery-prototype/run-sourcery.sh uninstall";

exec(command, (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    return;
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});

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
