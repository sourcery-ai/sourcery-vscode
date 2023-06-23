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
} from "vscode-languageclient/node";
import { getHubSrc } from "./hub";
import { RuleInputProvider } from "./rule-search";
import { ScanResultProvider } from "./rule-search-results";
import { ChatProvider, ChatRequest } from "./chat";
import { Recipe, RecipeProvider } from "./recipes";

function createLangServer(): LanguageClient {
  const token = workspace.getConfiguration("sourcery").get<string>("token");
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
    },
  };

  return new LanguageClient(command, serverOptions, clientOptions);
}

export function getSelectionLocation(): { uri: string; range: Range } | null {
  const editor = window.activeTextEditor;

  if (editor) {
    return { uri: editor.document.uri.toString(), range: editor.selection }; // Selection extends Range
  }

  return null;
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

function registerNotifications(
  languageClient: LanguageClient,
  scanResultTree: ScanResultProvider,
  scanResultTreeView: TreeView<TreeItem>,
  chatProvider: ChatProvider,
  recipeProvider: RecipeProvider,
  context: ExtensionContext
) {
  languageClient.onNotification("sourcery/vscode/executeCommand", (params) => {
    const command = params["command"];
    const args = params["arguments"] || [];
    commands.executeCommand(command, ...args);
  });

  languageClient.onNotification("sourcery/vscode/showSettings", () => {
    commands.executeCommand("workbench.action.openSettings", "sourcery");
  });

  languageClient.onNotification("sourcery/vscode/scanResults", (params) => {
    if (params.diagnostics.length > 0) {
      scanResultTree.update(params);
    }
    scanResultTreeView.title =
      "Results - " + params.results + " found in " + params.files + " files.";
  });

  languageClient.onNotification("sourcery/vscode/chatResults", (params) => {
    chatProvider.addResult(params.result);
  });

  languageClient.onNotification("sourcery/vscode/recipeList", (params) => {
    recipeProvider.addRecipes(params.recipes);
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
  chatProvider: ChatProvider,
  recipeProvider: RecipeProvider
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
    commands.registerCommand("sourcery.chat.clearChat", () => {
      let request: ExecuteCommandParams = {
        command: "sourcery/chat/clear",
        arguments: [],
      };
      languageClient
        .sendRequest(ExecuteCommandRequest.type, request)
        .then(() => {
          chatProvider.clearChat();
        });
    })
  );

  // {'message': {'type': 'recipe_request', 'data': {'id': 'debug_code', 'name': 'Debug', 'kind': 'recipe_request'}}

  context.subscriptions.push(
    commands.registerCommand("sourcery.chat.ask", () => {
      showAskSourceryQuickPick(recipeProvider.recipes).then((result: any) => {
        vscode.commands.executeCommand("sourcery.chat.focus").then(() => {
          let request;
          if ("id" in result) {
            request = {
              type: "recipe_request",
              data: {
                kind: "recipe_request",
                name: result.label,
                id: result.id,
              },
            };
          } else {
            request = {
              type: "chat_request",
              data: { kind: "user_message", message: result.label },
            };
          }

          vscode.commands.executeCommand("sourcery.chat_request", request);
        });
      });
    })
  );

  context.subscriptions.push(
    commands.registerCommand("sourcery.chat.ask", (arg?) => {
      showAskSourceryQuickPick(recipeProvider.recipes).then((result: any) => {
        vscode.commands.executeCommand("sourcery.chat.focus").then(() => {
          let request;
          let contextRange = "start" in arg ? arg : null;
          if ("id" in result) {
            request = {
              type: "recipe_request",
              data: {
                kind: "recipe_request",
                name: result.label,
                id: result.id,
              },
              context_range: contextRange,
            };
          } else {
            request = {
              type: "chat_request",
              data: { kind: "user_message", message: result.label },
              context_range: contextRange,
            };
          }

          vscode.commands.executeCommand("sourcery.chat_request", request);
        });
      });
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
    commands.registerCommand("sourcery.initialise_chat", () => {
      let request: ExecuteCommandParams = {
        command: "sourcery/chat/initialise",
        arguments: [],
      };
      languageClient.sendRequest(ExecuteCommandRequest.type, request);
    })
  );

  context.subscriptions.push(
    commands.registerCommand(
      "sourcery.chat_request",
      (message: ChatRequest) => {
        let selectionLocation = getSelectionLocation();
        if (message.context_range != null) {
          selectionLocation = {
            uri: selectionLocation.uri,
            range: message.context_range,
          };
        }
        const activeEditor = window.activeTextEditor;
        let activeFile = undefined;
        if (activeEditor) {
          activeFile = activeEditor.document.uri;
        }
        const allFiles = [];
        for (const tabGroup of vscode.window.tabGroups.all) {
          for (const tab of tabGroup.tabs) {
            if (tab.input instanceof vscode.TabInputText) {
              allFiles.push(tab.input.uri);
            }
          }
        }

        let request: ExecuteCommandParams = {
          command: "sourcery/chat/request",
          arguments: [
            {
              message: message,
              selected: selectionLocation,
              active_file: activeFile,
              all_open_files: allFiles,
            },
          ],
        };
        languageClient.sendRequest(ExecuteCommandRequest.type, request);
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

  const recipeProvider = new RecipeProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      RecipeProvider.viewType,
      recipeProvider,
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
    chatProvider,
    recipeProvider
  );

  showSourceryStatusBarItem(context);

  languageClient.start().then(() => {
    registerNotifications(
      languageClient,
      tree,
      treeView,
      chatProvider,
      recipeProvider,
      context
    );
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

function showAskSourceryQuickPick(recipes: Recipe[]) {
  return new Promise((resolve) => {
    const recipeNames = recipes.map((item) => item.name);
    const recipeItems = recipes.map((item) => ({
      label: item.name,
      id: item.id,
    }));

    const quickPick = window.createQuickPick();
    quickPick.placeholder = "Ask any question or choose one of these recipes";
    quickPick.items = recipeItems;

    quickPick.onDidAccept(() => {
      const selection = quickPick.activeItems[0];
      resolve(selection);
      quickPick.hide();
    });

    quickPick.onDidChangeValue(() => {
      // add what the user has typed to the pick list as the first item
      if (!recipeNames.includes(quickPick.value)) {
        const newItems = [{ label: quickPick.value }, ...recipeItems];
        quickPick.items = newItems;
      }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  });
}
