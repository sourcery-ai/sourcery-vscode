/**
 * Script for the Troubleshooting webview.
 *
 * This TypeScript file should be compiled using `npm run compile-webviews` which will create an associated
 * JavaScript file, which is what is actually included in the webview HTML.
 * */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
function createMessagePoster(vscode) {
  // Create a wrapper function which is strongly typed
  return function (message) {
    return vscode.postMessage(message);
  };
}
function withStickyScroll(container, wrapped) {
  return function () {
    var scrollHeightBefore = container.scrollHeight;
    wrapped.apply(this, arguments);
    var scrollHeight = container.scrollHeight,
      scrollTop = container.scrollTop,
      clientHeight = container.clientHeight;
    var scrollDiff = Math.abs(scrollHeight - clientHeight - scrollTop);
    var isScrolledToBottom =
      scrollDiff <= scrollHeight - scrollHeightBefore + 1;
    if (isScrolledToBottom) {
      container.scrollTop = scrollHeight - clientHeight;
    }
  };
}
function createElement(_a) {
  var _b;
  var tagName = _a.tagName,
    classList = _a.classList,
    id = _a.id,
    _c = _a.children,
    children = _c === void 0 ? [] : _c;
  // Generically create an element and attach its children
  var element = document.createElement(tagName);
  (_b = element.classList).add.apply(_b, classList);
  element.id = id;
  children.forEach(function (child) {
    return element.appendChild(child);
  });
  return element;
}
function createButtonGroup(children) {
  return createElement({
    tagName: "div",
    classList: ["troubleshooting__button_group"],
    children: children,
  });
}
function getMainSection() {
  return document.getElementById("main");
}
function getBody() {
  return document.getElementById("body");
}
function getLastFeedbackMessage() {
  var feedbackMessages = document.getElementsByClassName(
    "troubleshooting__message--feedback"
  );
  return feedbackMessages.item(feedbackMessages.length - 1);
}
function messageHandler(postMessage) {
  var _this = this;
  var setupCopyButton = function (block) {
    if (navigator.clipboard) {
      var text_1 = block.querySelector("code").innerText;
      var button_1 = document.createElement("button");
      button_1.innerHTML =
        '\n      <svg \n        viewBox="0 0 512 512" \n        xmlns="http://www.w3.org/2000/svg"\n        class="troubleshooting__code_block_action_button_icon"\n      >\n        <path d="m272 0h124.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9v220.1c0 26.5-21.5 48-48 48h-192c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48zm-224 128h144v64h-128v256h192v-32h64v48c0 26.5-21.5 48-48 48h-224c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48z" />        \n      </svg>\n    ';
      button_1.title = "Copy to Clipboard";
      button_1.classList.add("troubleshooting__code_block_action_button");
      button_1.onclick = function () {
        return __awaiter(_this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4 /*yield*/, navigator.clipboard.writeText(text_1)];
              case 1:
                _a.sent();
                button_1.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="troubleshooting__code_block_action_button_icon"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>';
                return [2 /*return*/];
            }
          });
        });
      };
      button_1.onblur = function () {
        return __awaiter(_this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            button_1.innerHTML =
              '\n        <svg \n          viewBox="0 0 512 512" \n          xmlns="http://www.w3.org/2000/svg"\n          class="troubleshooting__code_block_action_button_icon"\n        >\n          <path d="m272 0h124.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9v220.1c0 26.5-21.5 48-48 48h-192c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48zm-224 128h144v64h-128v256h192v-32h64v48c0 26.5-21.5 48-48 48h-224c-26.5 0-48-21.5-48-48v-288c0-26.5 21.5-48 48-48z" />        \n        </svg>\n      ';
            return [2 /*return*/];
          });
        });
      };
      return button_1;
    }
  };
  var setupReplaceButton = function (block) {
    var text = block.querySelector("code").innerText;
    var button = document.createElement("button");
    button.innerHTML =
      '\n      <svg xmlns="http://www.w3.org/2000/svg" class="troubleshooting__code_block_action_button_icon" viewBox="0 0 512 512"><path d="M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zm-47-201L201 79c-15-15-41-4.5-41 17v96H24c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24h136v96c0 21.5 26 32 41 17l168-168c9.3-9.4 9.3-24.6 0-34z"/></svg>\n    ';
    button.title = "Insert code at cursor";
    button.classList.add("troubleshooting__code_block_action_button");
    button.onclick = function () {
      return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          postMessage({ action: "insertAtCursor", content: text });
          return [2 /*return*/];
        });
      });
    };
    return button;
  };
  var setupActionButtons = function (block) {
    var copyButton = setupCopyButton(block);
    var replaceButton = setupReplaceButton(block);
    return createElement({
      tagName: "div",
      classList: ["troubleshooting__code_block_action_button_group"],
      children: [copyButton, replaceButton],
    });
  };
  var setupLinks = function (block) {
    block.querySelectorAll('a[href*="http"]').forEach(function (link) {
      return link.addEventListener("click", function () {
        return postMessage({
          action: "openLink",
          linkType: "url",
          target: link.href,
        });
      });
    });
    block.querySelectorAll('a[href*="file"]').forEach(function (link) {
      return link.addEventListener("click", function () {
        return postMessage({
          action: "openLink",
          linkType: "file",
          target: link.href,
        });
      });
    });
  };
  var createYesNoUserInput = function () {
    var mainSection = getMainSection();
    var yesButton = createElement({
      tagName: "button",
      classList: ["troubleshooting__button"],
    });
    yesButton.innerHTML =
      '\n      Yes <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>\n    ';
    var noButton = createElement({
      tagName: "button",
      classList: ["troubleshooting__button"],
    });
    noButton.innerHTML =
      '\n      No <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>\n    ';
    yesButton.onclick = function () {
      postMessage({ action: "resume", promptValue: true });
      yesButton.classList.add("troubleshooting__button--disabled");
      noButton.classList.add(
        "troubleshooting__button--disabled",
        "troubleshooting__button--deselected"
      );
      yesButton.disabled = true;
      noButton.disabled = true;
    };
    noButton.onclick = function () {
      postMessage({ action: "resume", promptValue: false });
      yesButton.classList.add(
        "troubleshooting__button--disabled",
        "troubleshooting__button--deselected"
      );
      noButton.classList.add("troubleshooting__button--disabled");
      yesButton.disabled = true;
      noButton.disabled = true;
    };
    var buttonGroup = createButtonGroup([yesButton, noButton]);
    var newMessage = createElement({
      tagName: "div",
      classList: ["troubleshooting__message", "troubleshooting__message--user"],
      children: [buttonGroup],
    });
    mainSection.append(newMessage);
  };
  var createTextUserInput = function () {
    var mainSection = getMainSection();
    var textInput = createElement({
      tagName: "textarea",
      classList: ["troubleshooting__prompt"],
    });
    var submitButton = createElement({
      tagName: "button",
      classList: ["troubleshooting__prompt_submit_button"],
    });
    var promptWrapper = createElement({
      tagName: "div",
      classList: ["troubleshooting__prompt_wrapper"],
      children: [textInput, submitButton],
    });
    var newMessage = createElement({
      tagName: "div",
      classList: ["troubleshooting__message", "troubleshooting__message--user"],
      children: [promptWrapper],
    });
    var onSubmit = function () {
      var promptValue = textInput.value;
      if (!promptValue) {
        return;
      }
      postMessage({ action: "resume", promptValue: promptValue });
      promptWrapper.remove();
      var par = createElement({ tagName: "p" });
      par.innerText = promptValue;
      newMessage.append(par);
    };
    submitButton.innerHTML =
      '\n      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="sidebar__chat-assistant--textarea-send-icon">\n        <path d="m498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6l-119.6-49.7-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1s-20.3-16.7-20.3-29.9v-83.6c0-4 1.5-7.8 4.2-10.7l167.6-182.9c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7l-203.4 180.7-88.3-44.2c-10.6-5.3-17.4-15.9-17.7-27.7s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />\n      </svg>\n    ';
    submitButton.onclick = onSubmit;
    // Listen for return key in order to send user messages
    textInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    });
    mainSection.append(newMessage);
    textInput.focus();
  };
  var handleInputMessage = function (_a) {
    var content = _a.content,
      kind = _a.kind;
    var mainSection = getMainSection();
    if (content) {
      var p = createElement({
        tagName: "p",
        classList: [
          "troubleshooting__message",
          "troubleshooting__message--assistance",
        ],
      });
      p.innerHTML = content;
      mainSection.append(p);
    }
    switch (kind) {
      case "yesno":
        createYesNoUserInput();
        break;
      case "text":
        createTextUserInput();
        break;
    }
  };
  var handleFeedbackMessage = function (_a) {
    var content = _a.content;
    var newMessage = createElement({
      tagName: "p",
      classList: [
        "troubleshooting__message",
        "troubleshooting__message--feedback",
        "troubleshooting__message--running",
      ],
    });
    newMessage.innerHTML = content;
    getMainSection().appendChild(newMessage);
  };
  var handleAssistanceMessage = function (_a) {
    var content = _a.content;
    var newMessage = createElement({
      tagName: "p",
      classList: [
        "troubleshooting__message",
        "troubleshooting__message--assistance",
      ],
    });
    newMessage.innerHTML = content;
    newMessage.querySelectorAll("pre").forEach(function (element) {
      element.appendChild(setupActionButtons(element));
    });
    setupLinks(newMessage);
    getMainSection().appendChild(newMessage);
  };
  var handleMessage = function (_a) {
    var _b;
    var data = _a.data;
    (_b = getLastFeedbackMessage()) === null || _b === void 0
      ? void 0
      : _b.remove();
    switch (data.type) {
      case "input":
        handleInputMessage(data);
        break;
      case "reset":
        postMessage({ action: "reset" });
        getMainSection().replaceChildren();
        setTimeout(function () {
          return postMessage({ action: "init" });
        }, 100); // delay a moment to make sure messages are received
        break;
      case "feedback":
        handleFeedbackMessage(data);
        break;
      case "assistance":
        handleAssistanceMessage(data);
        break;
      default:
        var newMessage = createElement({
          tagName: "p",
          classList: [
            "troubleshooting__message",
            "troubleshooting__message--" + data.type,
          ],
        });
        newMessage.innerHTML = data.content;
        getMainSection().appendChild(newMessage);
    }
  };
  return handleMessage;
}
function init(postMessage) {
  // Add children to main element
  // It's easier to do this in the script because we can reload the webview in development, rather than restarting
  // the whole extension development host.
  getBody().append(
    createElement({
      tagName: "section",
      classList: ["troubleshooting__main"],
      id: "main",
    }),
    createElement({
      tagName: "footer",
      classList: ["troubleshooting__footer"],
      id: "footer",
    })
  );
  window.addEventListener(
    "message",
    withStickyScroll(getMainSection(), messageHandler(postMessage))
  );
  setTimeout(function () {
    return postMessage({ action: "init" });
  }, 100); // delay a moment to make sure messages are received
}
(function () {
  var vscode = acquireVsCodeApi();
  var postMessage = createMessagePoster(vscode);
  init(postMessage);
})();
