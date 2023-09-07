"use strict";

import * as path from "path";
import * as fs from "fs";

export function getCodingAssistantAssetsPath(): string {
  // Allow complete local override
  if (process.env.SOURCERY_CODING_ASSISTANT_ASSETS_PATH) {
    console.log(
      "Environment-provided Sourcery Coding Assistant Assets Path: ",
      process.env.SOURCERY_CODING_ASSISTANT_ASSETS_PATH
    );
    return process.env.SOURCERY_CODING_ASSISTANT_ASSETS_PATH;
  }

  // Otherwise, production subdirectory should be set up to match development subdirectory
  const executablePath = getExecutablePath();
  const absoluteExecutablePath = path.isAbsolute(executablePath)
    ? executablePath
    : path.join(__dirname, "..", executablePath);

  let codingAssistantAssetsPath = path.join(
    absoluteExecutablePath,
    "..",
    "coding-assistant-app",
    "dist",
    "assets"
  );

  console.log(
    "Derived Sourcery Coding Assistant Assets Path: ",
    codingAssistantAssetsPath
  );

  return codingAssistantAssetsPath;
}

export function getExecutablePath(): string {
  if (process.env.SOURCERY_EXECUTABLE) {
    console.log(
      "Environment-provided Sourcery Executable Path: ",
      process.env.SOURCERY_EXECUTABLE
    );
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
