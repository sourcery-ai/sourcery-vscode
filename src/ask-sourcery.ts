import * as vscode from "vscode";
import { Recipe } from "./chat";

export function askSourceryCommand(recipes: Recipe[], contextRange?) {
  showAskSourceryQuickPick(recipes).then((result: any) => {
    if (result.type === "command") {
      vscode.commands.executeCommand(result.id);
      return;
    }

    let message;
    if (result.type === "recipe") {
      // the user selected a specific recipe
      message = {
        target: "languageServer",
        view: "chat",
        request: "executeRecipe",
        recipeId: result.id,
        name: result.label,
        trigger: "askSourcery",
      };
    } else {
      // the user entered some custom text
      message = {
        target: "languageServer",
        view: "chat",
        request: "sendMessage",
        textContent: result.label,
      };
    }

    vscode.commands.executeCommand("sourcery.coding_assistant", {
      message,
      ideState: {
        selectionLocation: {
          range: contextRange,
        },
      },
    });
  });
}

export function showAskSourceryQuickPick(recipes: Recipe[]) {
  return new Promise((resolve) => {
    const recipeNames = recipes.map((item) => item.name);
    const quickPickItems = recipes.map((item) => ({
      label: item.name,
      id: item.id,
      type: "recipe",
    }));

    quickPickItems.push({
      label: "Sourcery: Login",
      type: "command",
      id: "sourcery.login",
    });
    quickPickItems.push({
      label: "Sourcery: Toggle Code Lens for Coding Assistant",
      type: "command",
      id: "sourcery.chat.toggleCodeLens",
    });

    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder =
      "Ask Sourcery a question or choose one of these options";
    quickPick.items = quickPickItems;

    quickPick.onDidAccept(() => {
      const selection = quickPick.activeItems[0];
      resolve(selection);
      quickPick.hide();
    });

    quickPick.onDidChangeValue(() => {
      // add what the user has typed to the pick list as the first item
      if (!recipeNames.includes(quickPick.value)) {
        const newItems = [
          { label: quickPick.value, type: "chat" },
          ...quickPickItems,
        ];
        quickPick.items = newItems;
      }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  });
}
