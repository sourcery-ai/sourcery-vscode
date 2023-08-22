import * as vscode from "vscode";
import { Recipe, ServerRequest } from "./chat";

export function askSourceryCommand(recipes: Recipe[], contextRange?) {
  showAskSourceryQuickPick(recipes).then((result: any) => {
    let request: ServerRequest;
    if ("id" in result) {
      request = {
        type: "recipeRequest",
        data: {
          kind: "recipe_request",
          name: result.label,
          id: result.id,
        },
        context_range: contextRange,
      };
    } else {
      request = {
        type: "chatRequest",
        data: { kind: "user_message", message: result.label },
        context_range: contextRange,
      };
    }

    vscode.commands.executeCommand("sourcery.chat_request", request);
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
