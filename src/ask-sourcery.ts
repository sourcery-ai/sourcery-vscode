import * as vscode from "vscode";
import { Recipe } from "./chat";

export function askSourceryCommand(recipes: Recipe[], contextRange?) {
  showAskSourceryQuickPick(recipes).then((result: any) => {
    let message;
    if ("id" in result) {
      // the user selected a specific recipe
      message = {
        target: "languageServer",
        view: "chat",
        request: "executeRecipe",
        recipeId: result.id,
        name: result.label,
      };
    } else {
      // the user entered some custom text
      message = {
        target: "languageServer",
        view: "chat",
        request: "sendMessage",
        message: result.label,
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
    const recipeItems = recipes.map((item) => ({
      label: item.name,
      id: item.id,
    }));

    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder =
      "Ask Sourcery a question or choose one of these recipes";
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
