// End-to-end smoke test for a packaged VSIX: install it into a fresh VS Code,
// sign in with SOURCERY_TOKEN, wait for a Sourcery diagnostic on a Python file,
// then open the Sourcery sidebar and wait for the signed-in chat.
//
// Usage: node e2e/smoke.mjs path/to/sourcery.vsix
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
} from "@vscode/test-electron";
import { _electron as electron } from "playwright-core";

const STEP_TIMEOUT_MS = 180_000;
const ARTIFACTS_DIR = path.resolve("e2e-artifacts");

const EXAMPLE_PY = `def double_all(numbers):
    result = []
    for number in numbers:
        result.append(number * 2)
    return result
`;

const vsixPath = process.argv[2];
if (!vsixPath || !fs.existsSync(vsixPath)) {
  fail(`VSIX not found: ${vsixPath}`);
}

if (process.env.CI && !process.env.SOURCERY_TOKEN) {
  fail("SOURCERY_TOKEN is not set");
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "sourcery-e2e-"));
const userDataDir = path.join(root, "user-data");
const extensionsDir = path.join(root, "extensions");
const workspaceDir = path.join(root, "workspace");
const examplePath = path.join(workspaceDir, "example.py");

let exitCode = 0;
try {
  await run();
  log("PASS");
} catch (error) {
  console.error(`[e2e] FAIL: ${error.message}`);
  exitCode = 1;
}
if (!removeProfile()) {
  exitCode = 1;
}
process.exit(exitCode);

async function run() {
  fs.mkdirSync(path.join(userDataDir, "User"), { recursive: true });
  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.writeFileSync(examplePath, EXAMPLE_PY);
  fs.writeFileSync(
    path.join(userDataDir, "User", "settings.json"),
    JSON.stringify({
      ...(process.env.SOURCERY_TOKEN
        ? { "sourcery.token": process.env.SOURCERY_TOKEN }
        : {}),
      "security.workspace.trust.enabled": false,
      "workbench.startupEditor": "none",
      "workbench.tips.enabled": false,
      "extensions.autoUpdate": false,
      "extensions.ignoreRecommendations": true,
      "update.mode": "none",
      "telemetry.telemetryLevel": "off",
      "chat.disableAIFeatures": true,
    })
  );

  const vscodeExecutable = await downloadAndUnzipVSCode("stable");
  installExtension(vscodeExecutable, path.resolve(vsixPath));

  const env = { ...process.env };
  delete env.SOURCERY_EXECUTABLE;
  delete env.SOURCERY_TOKEN;

  const app = await electron.launch({
    executablePath: vscodeExecutable,
    args: [
      workspaceDir,
      examplePath,
      `--user-data-dir=${userDataDir}`,
      `--extensions-dir=${extensionsDir}`,
      "--disable-workspace-trust",
      "--skip-welcome",
      "--skip-release-notes",
      "--disable-telemetry",
      "--no-sandbox",
      "--disable-gpu",
    ],
    env,
    timeout: STEP_TIMEOUT_MS,
  });

  let page;
  try {
    page = await app.firstWindow({ timeout: STEP_TIMEOUT_MS });
    await page.locator(".monaco-workbench").waitFor({ timeout: STEP_TIMEOUT_MS });
    await page
      .locator(".editor-group-container .tab", { hasText: "example.py" })
      .first()
      .waitFor({ timeout: STEP_TIMEOUT_MS });
    log("VS Code is up with example.py open");

    await waitForSourceryDiagnostic(page);
    log("Sourcery diagnostic shown in the Problems panel");

    await page
      .locator('.part.activitybar [aria-label^="Sourcery"]')
      .first()
      .click({ timeout: STEP_TIMEOUT_MS });
    await waitForSignedInChat(page);
    log("Sourcery sidebar left Loading and shows the signed-in chat");
    await saveScreenshot(page, "signed-in");
  } catch (error) {
    await saveScreenshot(page, "failure");
    await app.close().catch(() => {});
    throw error;
  }

  await app.close();
}

function installExtension(executable, vsix) {
  const [cli, ...defaultArgs] =
    resolveCliArgsFromVSCodeExecutablePath(executable);
  const cliArgs = defaultArgs.filter(
    (arg) =>
      !arg.startsWith("--user-data-dir") && !arg.startsWith("--extensions-dir")
  );
  const result = spawnSync(
    cli,
    [
      ...cliArgs,
      `--user-data-dir=${userDataDir}`,
      `--extensions-dir=${extensionsDir}`,
      "--install-extension",
      vsix,
    ],
    {
      encoding: "utf-8",
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );
  if (result.status !== 0) {
    throw new Error(
      `Installing ${vsix} failed with exit code ${result.status}`
    );
  }
}

async function waitForSourceryDiagnostic(page) {
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+Shift+M" : "Control+Shift+M"
  );
  // The Problems tree is flat in the DOM: a file row at aria-level 1, then its markers.
  const deadline = Date.now() + STEP_TIMEOUT_MS;
  let rows = [];
  while (Date.now() < deadline) {
    rows = await page
      .locator(".markers-panel .monaco-list-row")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          level: element.getAttribute("aria-level"),
          text: element.innerText.replace(/\s+/g, " ").trim(),
        }))
      );
    let file = "";
    for (const row of rows) {
      if (row.level === "1") {
        file = row.text;
      } else if (
        file.startsWith("example.py") &&
        /sourcery\W+refactoring:/.test(row.text) &&
        /Ln 3, Col \d+/.test(row.text)
      ) {
        log(`Diagnostic on example.py: ${row.text}`);
        return;
      }
    }
    await sleep(1000);
  }
  throw new Error(
    "No Sourcery refactoring on line 3 of example.py: the language server did not start or did not analyse the file. " +
      `Problems panel: ${JSON.stringify(rows)}`
  );
}

async function waitForSignedInChat(page) {
  const deadline = Date.now() + STEP_TIMEOUT_MS;
  let lastState = "webview not found";
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const appRoot = frame.locator('[data-testid="app"]');
      if ((await appRoot.count().catch(() => 0)) === 0) {
        continue;
      }
      const text = await appRoot.innerText().catch(() => "");
      if (text.includes("Loading...")) {
        lastState = "Loading...";
      } else if (
        (await frame.locator('[data-testid="access-details-view"]').count()) >
        0
      ) {
        lastState = `signed out: ${text.replace(/\s+/g, " ").slice(0, 200)}`;
      } else if (
        (await frame.locator('[data-testid="chat-view"]').count()) > 0
      ) {
        return;
      } else {
        lastState = text.replace(/\s+/g, " ").slice(0, 200);
      }
    }
    await sleep(1000);
  }
  throw new Error(
    `Sourcery sidebar never showed the signed-in chat; last state: ${lastState}`
  );
}

async function saveScreenshot(page, name) {
  if (!page) {
    return;
  }
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const vsixName = path.basename(vsixPath, ".vsix");
  const file = path.join(ARTIFACTS_DIR, `${name}-${vsixName}.png`);
  await page.screenshot({ path: file }).catch(() => {});
  log(`Screenshot: ${file}`);
}

// The profile holds the token, so failing to remove it fails the run.
function removeProfile() {
  try {
    // On Windows the language server can hold files open for a while after VS Code exits.
    fs.rmSync(root, {
      recursive: true,
      force: true,
      maxRetries: 15,
      retryDelay: 250,
    });
    return true;
  } catch (error) {
    console.error(`[e2e] FAIL: could not remove ${root}: ${error.message}`);
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
  console.log(`[e2e] ${message}`);
}

function fail(message) {
  console.error(`[e2e] FAIL: ${message}`);
  process.exit(1);
}
