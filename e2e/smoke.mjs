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
const homeDir = path.join(root, "home");
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
  for (const dir of [
    ".config",
    path.join(".local", "share"),
    path.join("AppData", "Roaming"),
    path.join("AppData", "Local"),
  ]) {
    fs.mkdirSync(path.join(homeDir, dir), { recursive: true });
  }
  fs.writeFileSync(examplePath, EXAMPLE_PY);
  fs.writeFileSync(
    path.join(userDataDir, "User", "settings.json"),
    JSON.stringify({
      ...(process.env.SOURCERY_TOKEN
        ? { "sourcery.token": process.env.SOURCERY_TOKEN }
        : {}),
      "security.workspace.trust.enabled": false,
      "workbench.startupEditor": "none",
      // Signing in opens the welcome file, which would replace example.py's preview tab.
      "workbench.editor.enablePreview": false,
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

  // The binary counts a first run in its own database, under the home directory the
  // test gives it, so launch 1 is always a first run and opens the welcome file. That
  // file's analysis would abort example.py's (PRD-84), so the review gets launch 2.
  await withVSCode(vscodeExecutable, "first-run", async (page) => {
    await waitForTab(page, "welcome-to-sourcery.py");
    log("First run opened the welcome file");
    await runCommand(page, "View: Focus Problems");
    await waitForSourceryDiagnostic(page, "welcome-to-sourcery.py", /Ln \d+/);
    // Nothing restored into the next launch, so example.py is analysed alone.
    await runCommand(page, "View: Close All Editors");
  });

  await withVSCode(vscodeExecutable, "signed-in", async (page) => {
    await openFile(page, "example.py");
    await runCommand(page, "View: Focus Problems");
    await waitForSourceryDiagnostic(page, "example.py", /Ln 3, Col \d+/);

    // Reload the sidebar so it must get its state through its own request.
    await openSourcerySidebar(page);
    await waitForWebviewApp(page);
    await markWebviewsStale(page);
    await runCommand(page, "Developer: Reload Webviews");
    await waitForSignedInChat(page);
    log("Sourcery sidebar left Loading and shows the signed-in chat");
  });
}

async function withVSCode(vscodeExecutable, name, steps) {
  // Keep the binary's config, login and database inside the test's temp root.
  const env = {
    ...process.env,
    HOME: homeDir,
    XDG_CONFIG_HOME: path.join(homeDir, ".config"),
    XDG_DATA_HOME: path.join(homeDir, ".local", "share"),
    APPDATA: path.join(homeDir, "AppData", "Roaming"),
    LOCALAPPDATA: path.join(homeDir, "AppData", "Local"),
  };
  delete env.SOURCERY_EXECUTABLE;
  delete env.SOURCERY_TOKEN;

  log(`Launching VS Code (${name})`);
  const app = await electron.launch({
    executablePath: vscodeExecutable,
    args: [
      workspaceDir,
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
    await steps(page);
    await saveScreenshot(page, name);
  } catch (error) {
    await saveScreenshot(page, `failure-${name}`);
    await app.close().catch(() => {});
    throw error;
  }
  await app.close();
}

async function waitForTab(page, name) {
  const tab = page.locator(".editor-group-container .tab", { hasText: name });
  const deadline = Date.now() + STEP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await throwIfServerFailed(page);
    if ((await tab.count()) > 0) {
      return;
    }
    await sleep(1000);
  }
  throw new Error(`${name} never opened`);
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

async function openSourcerySidebar(page) {
  // Signing in can open the sidebar itself, and clicking an open container closes it.
  const open = page.locator(
    '.part.activitybar .action-item.checked [aria-label^="Sourcery"]'
  );
  if ((await open.count()) === 0) {
    await page
      .locator('.part.activitybar [aria-label^="Sourcery"]')
      .first()
      .click({ timeout: STEP_TIMEOUT_MS });
  }
}

async function waitForWebviewApp(page) {
  const deadline = Date.now() + STEP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if ((await frame.locator('[data-testid="app"]').count().catch(() => 0)) > 0) {
        // Let the app finish mounting and focusing its input before the reload.
        await sleep(3000);
        return;
      }
    }
    await sleep(1000);
  }
  throw new Error("The Sourcery sidebar webview never loaded");
}

async function markWebviewsStale(page) {
  for (const frame of page.frames()) {
    await frame
      .evaluate(() => {
        window.__sourceryE2eStale = true;
      })
      .catch(() => {});
  }
}

async function runCommand(page, label) {
  await quickPick(page, `>${label}`, label);
}

async function openFile(page, name) {
  // The palette without its ">" prefix is Quick Open.
  await quickPick(page, name, name);
  await page
    .locator(".editor-group-container .tab.active", { hasText: name })
    .waitFor({ timeout: STEP_TIMEOUT_MS });
}

async function quickPick(page, text, rowText) {
  // On a first run the sidebar takes focus and closes the palette, so retry.
  const input = page.locator(".quick-input-widget input");
  const row = page
    .locator(".quick-input-widget .monaco-list-row", { hasText: rowText })
    .first();
  for (let attempt = 1; ; attempt++) {
    try {
      await page.keyboard.press("F1");
      await input.fill(text, { timeout: 5000 });
      await row.waitFor({ timeout: 5000 });
      await page.keyboard.press("Enter");
      return;
    } catch (error) {
      if (attempt === 5) {
        throw new Error(`Could not pick "${text}": ${error.message}`);
      }
      await page.keyboard.press("Escape");
      await sleep(2000);
    }
  }
}

async function waitForSourceryDiagnostic(page, fileName, linePattern) {
  const deadline = Date.now() + STEP_TIMEOUT_MS;
  let rows = [];
  while (Date.now() < deadline) {
    await throwIfServerFailed(page);
    // The Problems tree is flat in the DOM: a file row at aria-level 1, then its markers.
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
        file.startsWith(fileName) &&
        /sourcery\W+refactoring:/.test(row.text) &&
        linePattern.test(row.text)
      ) {
        log(`Diagnostic on ${fileName}: ${row.text}`);
        return;
      }
    }
    await sleep(1000);
  }
  throw new Error(
    `No Sourcery refactoring on ${fileName} (${linePattern}): the language server did not start or did not analyse the file. ` +
      `Problems panel: ${JSON.stringify(rows)}`
  );
}

async function waitForSignedInChat(page) {
  const deadline = Date.now() + STEP_TIMEOUT_MS;
  let lastState = "webview not found";
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (await frame.evaluate(() => window.__sourceryE2eStale).catch(() => true)) {
        continue;
      }
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

async function throwIfServerFailed(page) {
  const serverError = page.locator(".notification-toast", {
    hasText: "couldn't create connection to server",
  });
  if ((await serverError.count()) > 0) {
    throw new Error(
      `Sourcery language server failed to start: ${(
        await serverError.first().innerText()
      ).replace(/\s+/g, " ")}`
    );
  }
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
