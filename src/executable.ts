"use strict";

import * as path from "path";
import * as fs from "fs";

export function getCodingAssistantAssetsPath(): string {
  if (process.env.SOURCERY_CODING_ASSISTANT_ASSETS_PATH) {
    console.log(process.env.SOURCERY_CODING_ASSISTANT_ASSETS_PATH);
    return process.env.SOURCERY_CODING_ASSISTANT_ASSETS_PATH;
  }

  return path.join(path.dirname(getExecutablePath()), "assets");
}

export function getExecutablePath(): string {
  if (process.env.SOURCERY_EXECUTABLE) {
    console.log(process.env.SOURCERY_EXECUTABLE);
    return process.env.SOURCERY_EXECUTABLE;
  }
  const sourcery_binaries = path.join(__dirname, "..", "sourcery_binaries");
  const activePath = path.join(sourcery_binaries, "active");
  if (fs.existsSync(activePath)) {
    if (process.platform == "win32") {
      return path.join(activePath, "sourcery.exe");
    } else if (process.platform == "darwin") {
      return path.join(activePath, "sourcery");
    } else {
      // Assume everything else is linux compatible
      return path.join(activePath, "sourcery");
    }
  } else {
    if (process.platform == "win32") {
      return path.join(sourcery_binaries, "install/win/sourcery.exe");
    } else if (process.platform == "darwin") {
      return path.join(sourcery_binaries, "install/mac/sourcery");
    } else {
      // Assume everything else is linux compatible
      return path.join(sourcery_binaries, "install/linux/sourcery");
    }
  }
}
