"use strict";

import * as path from "path";
import { getExecutablePath } from "./executable";

import * as vscode from "vscode";
import {
  commands,
  env,
  ExtensionContext,
  extensions,
  Range,
  StatusBarAlignment,
  TextEditorRevealType,
  TreeItem,
  TreeView,
  Uri,
  version,
  ViewColumn,
  WebviewPanel,
  window,
  workspace,
} from "vscode";
import {
  ExecuteCommandParams,
  ExecuteCommandRequest,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  URI,
} from "vscode-languageclient/node";
import { getHubSrc } from "./hub";
import { RuleInputProvider } from "./rule-search";
import { ScanResultProvider } from "./rule-search-results";
import { ChatProvider } from "./chat";
import { askSourceryCommand } from "./ask-sourcery";

function createLangServer(): LanguageClient {
  const token = workspace.getConfiguration("sourcery").get<string>("token");
  const showCodeLens = workspace
    .getConfiguration("sourcery")
    .get<boolean>("codeLens");

  const packageJson = extensions.getExtension("sourcery.sourcery").packageJSON;
  const extensionVersion = packageJson.version;

  const command = getExecutablePath();

  const serverOptions: ServerOptions = {
    command,
    args: ["lsp"],
    options: {
      env: {
        PYTHONHASHSEED: "0",
        ...process.env,
      },
    },
  };

  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: "sourcery",
    documentSelector: [
      { language: "python", scheme: "file" },
      { language: "javascript", scheme: "file" },
      { language: "typescript", scheme: "file" },
      { language: "javascriptreact", scheme: "file" },
      { language: "typescriptreact", scheme: "file" },
      { language: "python", scheme: "untitled" },
      { language: "python", scheme: "vscode-notebook-cell" },
      { language: "yaml", pattern: "**/.sourcery.yaml" },
      { language: "yaml", pattern: "**/sourcery.yaml" },
      { language: "yaml", pattern: "**/.sourcery/rules/*.yaml" },
    ],
    synchronize: {
      configurationSection: "sourcery",
    },
    initializationOptions: {
      token: token,
      editor_version: "vscode " + version,
      extension_version: extensionVersion,
      telemetry_enabled: env.isTelemetryEnabled,
      show_code_lens: showCodeLens,
    },
  };

  return new LanguageClient(command, serverOptions, clientOptions);
}

export function getSelectedText(): string | null {
  const editor = window.activeTextEditor;

  if (editor) {
    return editor.document.getText(editor.selection);
  }

  return null;
}

function showSourceryStatusBarItem(context: ExtensionContext) {
  // Create the status bar
  const myStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
  myStatusBarItem.command = "sourcery.hub.start";
  myStatusBarItem.text = "Sourcery";
  myStatusBarItem.tooltip = "Manage Sourcery settings";
  context.subscriptions.push(myStatusBarItem);
  myStatusBarItem.show();
}

function registerNotifications({
  languageClient,
  scanResultTree,
  scanResultTreeView,
  chatProvider,
  context,
}: {
  languageClient: LanguageClient;
  scanResultTree: ScanResultProvider;
  scanResultTreeView: TreeView<TreeItem>;
  chatProvider: ChatProvider;
  context: ExtensionContext;
}) {
  languageClient.onNotification("sourcery/vscode/executeCommand", (params) => {
    const command = params["command"];
    const args = params["arguments"] || [];
    commands.executeCommand(command, ...args);
  });

  languageClient.onNotification("sourcery/vscode/showSettings", (params) => {
    const section = params && params.section ? params.section : "sourcery";
    commands.executeCommand("workbench.action.openSettings", section);
  });

  languageClient.onNotification("sourcery/vscode/scanResults", (params) => {
    if (params.diagnostics.length > 0) {
      scanResultTree.update(params);
    }
    scanResultTreeView.title =
      "Results - " + params.results + " found in " + params.files + " files.";
  });

  languageClient.onNotification("sourcery/codingAssistant", (params) => {
    chatProvider.postCommand(params);
  });

  languageClient.onNotification("sourcery/vscode/viewProblems", () => {
    commands.executeCommand("workbench.actions.view.problems");
  });

  languageClient.onNotification("sourcery/vscode/accept_recommendation", () => {
    commands.executeCommand(
      "setContext",
      "acceptRecommendationContextKey",
      true
    );
  });

  languageClient.onNotification("sourcery/vscode/showUrl", (params) => {
    env.openExternal(Uri.parse(params["url"]));
  });

  languageClient.onNotification("sourcery/vscode/showWelcomeFile", () => {
    openWelcomeFile(context);
  });
}

function registerCommands(
  context: ExtensionContext,
  riProvider: RuleInputProvider,
  languageClient: LanguageClient,
  tree: ScanResultProvider,
  treeView: TreeView<TreeItem>,
  hubWebviewPanel: WebviewPanel,
  chatProvider: ChatProvider
) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      RuleInputProvider.viewType,
      riProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.selectCode", (open_uri, start, end) => {
      workspace.openTextDocument(open_uri).then((doc) => {
        window.showTextDocument(doc).then((e) => {
          e.selection = new vscode.Selection(start, end);
          e.revealRange(new Range(start, end), TextEditorRevealType.InCenter);
        });
      });
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.scan.toggleAdvanced", () => {
      // Tell the rules webview to toggle
      riProvider.toggle();
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.chat.ask", (arg?) => {
      let contextRange = arg && "start" in arg ? arg : null;
      askSourceryCommand(chatProvider.recipes, contextRange);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.chat.toggleCodeLens", () => {
      const config = vscode.workspace.getConfiguration();
      const currentValue = config.get("sourcery.codeLens");
      config.update(
        "sourcery.codeLens",
        !currentValue,
        vscode.ConfigurationTarget.Global
      );
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.scan.selectLanguage", () => {
      const items = ["python", "javascript"];

      window
        .showQuickPick(items, {
          canPickMany: false,
          placeHolder: "Select language",
        })
        .then((selected) => {
          riProvider.setLanguage(selected);
        });
    })
  );

  // Enable/disable effects
  context.subscriptions.push(
    commands.registerCommand("sourcery.effects.enable", () =>
      effects_set_enabled(true)
    )
  );
  context.subscriptions.push(
    commands.registerCommand("sourcery.effects.disable", () =>
      effects_set_enabled(false)
    )
  );
  function effects_set_enabled(enabled: boolean) {
    vscode.commands.executeCommand(
      "setContext",
      "sourcery.effects.enabled",
      enabled
    );
    let request: ExecuteCommandParams = {
      command: "sourcery.effects.set_enabled",
      arguments: [enabled],
    };
    languageClient.sendRequest(ExecuteCommandRequest.type, request);
  }

  context.subscriptions.push(
    commands.registerCommand("sourcery.scan.applyRule", (entry) => {
      workspace.openTextDocument(entry.resourceUri).then((doc) => {
        window.showTextDocument(doc).then((e) => {
          e.revealRange(
            new Range(entry.startPosition, entry.endPosition),
            TextEditorRevealType.InCenter
          );
          for (let edit of entry.edits) {
            const workspaceEdit = new vscode.WorkspaceEdit();

            const textEdit = new vscode.TextEdit(
              new vscode.Range(
                edit.range.start.line,
                edit.range.start.character,
                edit.range.end.line,
                edit.range.end.character
              ),
              edit.newText
            );

            // Apply the edit to the current workspace
            workspaceEdit.set(entry.resourceUri, [textEdit]);

            workspace.applyEdit(workspaceEdit);
          }
        });
      });
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.welcome.open", () => {
      openWelcomeFile(context);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.scan.open", () => {
      vscode.commands.executeCommand("setContext", "sourceryRulesActive", true);

      vscode.commands.executeCommand("sourcery.rules.focus").then(() => {
        const input = getSelectedText();
        riProvider.setPattern(input);
      });
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.walkthrough.open", () => {
      openWelcomeFile(context);
      commands.executeCommand(
        "workbench.action.openWalkthrough",
        "sourcery.sourcery#sourcery.walkthrough",
        true
      );
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.config.create", () => {
      let request: ExecuteCommandParams = {
        command: "config/create",
        arguments: [],
      };
      languageClient
        .sendRequest(ExecuteCommandRequest.type, request)
        .then((values) => {
          openDocument(path.join(workspace.rootPath, ".sourcery.yaml"));
        });
    })
  );

  context.subscriptions.push(
    commands.registerCommand(
      "sourcery.rule.create",
      (rule, advanced: boolean, language: string) => {
        vscode.window
          .showInputBox({
            title: "What would you like to call your rule?",
            prompt:
              "This should be lowercase, with words separated by hyphens (e.g. my-brilliant-rule)",
          })
          .then((name) => {
            if (name) {
              let request: ExecuteCommandParams = {
                command: "config/rule/create",
                arguments: [
                  {
                    rule_id: name,
                    rule: rule,
                    inplace: false,
                    advanced: advanced,
                    language: language,
                  },
                ],
              };
              languageClient
                .sendRequest(ExecuteCommandRequest.type, request)
                .then((result) => {
                  const openPath = Uri.file(result);
                  workspace.openTextDocument(openPath).then((doc) => {
                    window.showTextDocument(doc);
                  });
                });
            }
          });
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "sourcery.refactor.workspace",
      (resource: Uri, selected?: Uri[]) => {
        let request: ExecuteCommandParams = {
          command: "refactoring/scan",
          arguments: [
            {
              uri: resource,
              all_uris: selected,
            },
          ],
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "sourcery.coding_assistant",
      ({
        message,
        ideState,
      }: {
        message: any; // we don't care about the details of the message
        // the request may override any of the IDE fields if necessary
        ideState?: Partial<IDEState>;
      }) => {
        const localIDEState = getLocalIDEState();

        let params: ExecuteCommandParams = {
          command: "sourcery.coding_assistant",
          arguments: [
            {
              message,
              ideState: {
                ...localIDEState,
                ...ideState,
                selectionLocation: {
                  ...localIDEState.selectionLocation,
                  ...ideState?.selectionLocation,
                },
              },
            },
          ],
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, params);
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "sourcery.scan.rule",
      (rule, advanced: boolean, fix: boolean, language: string) => {
        if (fix) {
          vscode.window
            .showInformationMessage("Are you sure?", "Yes", "No")
            .then((answer) => {
              if (answer === "Yes") {
                runScan(rule, advanced, fix, language);
              }
            });
        } else {
          runScan(rule, advanced, fix, language);
        }
      }
    )
  );

  function runScan(rule, advanced: boolean, fix: boolean, language: string) {
    tree.clear();
    treeView.title = "Results";
    let request: ExecuteCommandParams = {
      command: "sourcery/rule/scan",
      arguments: [
        {
          rule: rule,
          rule_id: "test-rule",
          advanced: advanced,
          inplace: fix,
          language: language,
        },
      ],
    };
    languageClient.sendRequest(ExecuteCommandRequest.type, request);
  }

  context.subscriptions.push(
    commands.registerCommand(
      "sourcery.clones.workspace",
      (resource: Uri, selected?: Uri[]) => {
        let request: ExecuteCommandParams = {
          command: "clone/scan",
          arguments: [
            {
              uri: resource,
              all_uris: selected,
            },
          ],
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
      }
    )
  );

  // Create the "open hub" command
  // This is activated from the status bar (see below)
  context.subscriptions.push(
    commands.registerCommand("sourcery.hub.start", async () => {
      // Instruct the language server to start the hub server
      // See `core/hub/app` and `core/binary/lsp/sourcery_ls`

      languageClient.sendRequest(ExecuteCommandRequest.type, {
        command: "sourcery.startHub",
        arguments: [],
      });

      // reopen the hub panel if it exists
      // otherwise create it
      if (hubWebviewPanel) {
        hubWebviewPanel.reveal();
      } else {
        // Open a webview panel and fill it with a static empty page
        // The iframe handles loading the actual content
        hubWebviewPanel = window.createWebviewPanel(
          "sourceryhub",
          "Sourcery Hub",
          ViewColumn.Active,
          {
            enableScripts: true,
          }
        );

        hubWebviewPanel.webview.html = getHubSrc();
        hubWebviewPanel.onDidDispose(
          () => {
            hubWebviewPanel = undefined;
          },
          null,
          context.subscriptions
        );
      }
    })
  );
}

export function activate(context: ExtensionContext) {
  const languageClient = createLangServer();
  let hubWebviewPanel: WebviewPanel | undefined = undefined;

  let tree = new ScanResultProvider();

  let treeView = vscode.window.createTreeView("sourcery.rules.treeview", {
    treeDataProvider: tree,
  });

  const riProvider = new RuleInputProvider(context);

  const chatProvider = new ChatProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChatProvider.viewType,
      chatProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  registerCommands(
    context,
    riProvider,
    languageClient,
    tree,
    treeView,
    hubWebviewPanel,
    chatProvider
  );

  showSourceryStatusBarItem(context);

  languageClient.start().then(() => {
    registerNotifications({
      languageClient,
      scanResultTree: tree,
      scanResultTreeView: treeView,
      chatProvider,
      context,
    });
  });
}

function openWelcomeFile(context: ExtensionContext) {
  openDocument(path.join(context.extensionPath, "welcome-to-sourcery.py"));
}

function openDocument(document_path: string) {
  const openPath = Uri.file(document_path);
  workspace.openTextDocument(openPath).then((doc) => {
    window.showTextDocument(doc);
  });
}

type IDEState = {
  activeFile?: URI;
  allOpenFiles: URI[];
  selectionLocation?: {
    uri: URI;
    range: Range;
  };
};

function getLocalIDEState(): IDEState {
  const { activeTextEditor } = window;
  const activeFile = activeTextEditor?.document.uri.toString();
  const allOpenFiles = vscode.window.tabGroups.all.flatMap((tabGroup) =>
    tabGroup.tabs
      .map((tab) => tab.input)
      .filter(
        (input): input is vscode.TabInputText =>
          input instanceof vscode.TabInputText
      )
      .map((input) => input.uri.toString())
  );
  const selectionLocation = activeTextEditor
    ? {
        uri: activeTextEditor.document.uri.toString(),
        range: activeTextEditor.selection,
      }
    : undefined;

  return { activeFile, allOpenFiles, selectionLocation };
}
