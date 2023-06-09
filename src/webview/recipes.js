//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  const recipeSection = document.querySelector(".recipe-section");

  function sendMessageToExtension(recipe) {
    vscode.postMessage({ type: "recipe_request", data: recipe });
  }

  // Add each recipe to the UI as a button with an associated event
  function addRecipesToUI(recipes) {
    for (let i = 0; i < recipes.length; i++) {
      const templateMessage = `<button class="${recipes[i]["id"]}" >${recipes[i]["name"]}</button>`;
      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("btnContainer");
      buttonContainer.innerHTML = templateMessage;
      buttonContainer
        .querySelector(`.${recipes[i]["id"]}`)
        .addEventListener("click", () => {
          sendMessageToExtension(recipes[i]["name"]);
        });
      recipeSection.append(buttonContainer);
    }
  }

  window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.command === "add_recipes") {
      addRecipesToUI(message.result);
    }
  });
})();
