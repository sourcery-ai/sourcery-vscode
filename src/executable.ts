'use strict';

import * as path from 'path';
import * as fs from 'fs';


export function getExecutablePath(): string {
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



