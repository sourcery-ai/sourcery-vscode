"use strict";

import * as path from "path";
const { exec } = require("child_process");
import { getExecutablePath } from "./executable";
const command = path.join(
  __dirname,
  "..",
  "sourcery_binaries/" + getExecutablePath() + " uninstall"
);

exec(command);
