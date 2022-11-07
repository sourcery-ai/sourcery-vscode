[twitter-shield]: https://img.shields.io/twitter/follow/SourceryAI?style=social
[twitter-url]: https://bit.ly/sourceryai-twitter
[github-shield]: https://img.shields.io/github/stars/sourcery-ai/sourcery?style=social
[github-url]: https://bit.ly/sourceryai-github
[vscode-shield]: https://img.shields.io/visual-studio-marketplace/r/sourcery.sourcery?logo=visual-studio-code&style=social
[vscode-url]: https://bit.ly/sourceryai-vscode

[![Github Repo][github-shield]][github-url]
[![VSCode Plugin][vscode-shield]][vscode-url]
[![Twitter Follow][twitter-shield]][twitter-url]

![Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Logo_VS_Code_Description.png)

Sourcery is the **pair programmer** who will help you improve your code anytime you're working in Python. It **reviews and refactors** your code automatically so you can spend more time focused on writing new code and less time cleaning things up.

![Sourcery in VS Code](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_VS_Code_Example.gif)

---

## Sourcery

Sourcery is a VS Code extension to help make all of your Python code cleaner and more readable. Quickly find areas **where your code could be refactored**, see **instant suggestions for improvement**, and understand how new changes impact your **code quality**. 

Here are some of the features Sourcery offers to help improve your code:

- [Real-time refactoring suggestions](#real-time-refactoring-suggestions)
- [Continuous code quality feedback](#continuous-code-quality-feedback)
- [Multi-file analysis](#multi-file-analysis)
- [Duplicate code detection](#duplicate-code-detection)
- [GitHub Pull Request reviews](#github-pull-request-review)
- [Sourcery CLI, CI, & Pre-Commit Hook options](#sourcery-cli)

To start using Sourcery on your code, check out our [Getting Started guide](https://docs.sourcery.ai/getting-started/).

---

## Features

### Real-time refactoring suggestions

![Refactoring Code with Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_VS_Code_Refactoring.gif)

While you work, Sourcery will review all of the Python files you have open and look for opportunities to clean up and refactor your code. Once Sourcery finds a potential refactoring it will underline that section of your code.

Hover your mouse over the underlined section of code to see the changes Sourcery suggests and see a diff of the proposed change.

To make the change, just bring up the quick fix menu and choose to accept the change. Sourcery will then apply the change to your code. We're constantly adding new refactorings that Sourcery can make. The current list of the types of refactorings Sourcery can make is available **[here](https://docs.sourcery.ai/refactorings/)**. 

The commands to bring up the quick fix menu depend on your OS & region, but generally they are:


 | OS | Keyboard Shortcut  |
| --- | --- |
| Mac | Command . |
| Windows | Ctrl . |
| Linux | Ctrl . |

Sourcery reviews all of the Python files you have open. You can get an overview of all the suggestions Sourcery has in the Problem window.

#### Other Suggested Tools

- We recommend using Sourcery alongside the [Error Lens plugin](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) - it helps make refactoring suggestions easier to see and understand.

### Continuous code quality feedback

![Code Quality Metrics in Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Metrics_VS_Code.gif)

Sourcery gives each of your functions a quality score ranging from 0% (bad) - 100% (good) and also gives you sub-scores on Method Length, Complexity, and Working Memory so that you can figure out how to structure your code as cleanly as possible.

**Method Length** is a metric is a measure of how long each method is on average. It is based on the number of nodes in the method's Abstract Syntax Tree.

**Complexity** is a measure of how difficult your code is to read and understand. It is based on these principles:

- Each break in the linear flow of the code makes it harder to understand
- When these flow-breaking structures are nested they are even harder to understand

**Working Memory** is a measure of the number of variables that need to be kept in your working memory as you read through the code.

Sourcery will warn you if your overall quality score for a function falls below 25%.

### Multi-File Analysis

![Multi-File Analysis & Refactoring in Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Example_Full_Project_Scan_VS_Code.gif)

You can use Sourcery to refactor a single file, a folder, or your whole project at once. 

Right-click on any item in the Explorer window and select "Sourcery → Scan for Refactorings". Sourcery will show you a notification when the scan is done & will show all of the refactorings it found in the Problems window. 

Multi-File Analysis requires a Sourcery Pro subscription. To get a month free access to Sourcery Pro, **[sign up for an account on the Sourcery site](https://sourcery.ai/signup/?utm_source=VS-Code)**.

### Duplicate Code Detection

![Duplicate Code Detection in Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Example_Duplicates_VS_Code.gif)

Sourcery can help you find duplicate code and near-duplicate code across your whole project. 

Right-click on any item in the Explorer window and select "Sourcery → Detect Clones". Sourcery will show you a notification when it's done scanning for clones & will show you all of the instances of duplication it found in the Problems window. 

By default, Sourcery will flag items where at least 3 lines are duplicates or near-duplicates that occur at least twice in the scanned files. 

Duplicate Code Detection requires a Sourcery Pro subscription. To get a month free access to Sourcery Pro, **[sign up for an account on the Sourcery site](https://sourcery.ai/signup/?utm_source=VS-Code)**.

### GitHub Pull Request Review

![Sourcery Reviewing GitHub PRs](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_GitHub-Refactor-Branch.gif)

Sourcery can help you speed up code reviews and clean up every new commit by automatically reviewing each of your GitHub pull requests.

To get started, add [Sourcery to your GitHub repo](https://github.com/apps/sourcery-ai/installations/new). Sourcery will then start reviewing every new pull request automatically!

### Sourcery CLI

If you want to clean up a bigger portion of legacy code, Sourcery CLI comes in handy.

- With the `refactor` command, you can scan multiple files or directories for refactorings.
- With the `--in-place` option, you can apply the suggested refactorings immediately.

With Sourcery CLI, you can also integrate Sourcery with your favorite tools.

#### CI / Pre-Commit Hook options: 

![Sourcery CLI](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery-CLI.gif)

You can use Sourcery to review every new bit of code you and your team are working on by adding Sourcery into your CI or running it as a Pre-Commit Hook. 

Sourcery will review every new change and you can set it up to either automatically make changes to your code when it detects opportunities to refactor, or you can just have it notify you when it finds refactorings.

The Sourcery CLI, CI, & Pre-Commit Hook options require a Sourcery Team subscription. **[You can sign up for a Team plan here](https://sourcery.ubpages.com/sourcery-team-sign-up-1/)**.

---

## Configuring Sourcery

Not everyone's coding style is the same, so we know you won't always want to accept every refactoring Sourcery suggests. 

Generally, for configurations, Sourcery uses configuration settings from `.sourcery.yaml` in the project directory.

The config file uses YAML syntax. If you are new to YAML checkout "[Learn YAML in 5 minutes](https://www.codeproject.com/Articles/1214409/Learn-YAML-in-five-minutes)".

Here is the default set of values set for the file. If a config file isn't set or if a setting isn't specified then Sourcery will use these values:

```
ignore: []

refactor:
  skip: []

metrics:
  quality_threshold: 25.0

clone_detection:
  min_lines: 3
  min_duplicates: 2
  identical_clones_only: false

github:
  labels: []
  ignore_labels: [sourcery-ignore]
  request_review: author
  sourcery_branch: sourcery/{base_branch}
```

You can easily configure Sourcery to:

- [Only show certain types of refactorings](#choosing-which-refactorings-to-be-shown)
- [Not show refactorings on certain files, paths, or functions](#skip-refactorings)
- [Tweak when and how you get warned about code quality issues](#setting-when-sourcery-warns-about-quality-issues)

### Choosing which refactorings to be shown

You can choose to have Sourcery never show you a specific type of refactoring by adding it to a list under the `refactor: skip` section of the .sourcery.yaml file. Just add in the refactoring ID for the refactoring you don't want to see and Sourcery will stop suggesting it.

Individual refactoring ids are displayed in the plugin suggestions and GitHub Bot comments for easy lookup or you can find a full list in the [refactorings section](https://docs.sourcery.ai/refactorings/) of the docs.

For example:

```
refactor:
  skip:
    - assign-if-exp
    - de-morgan
```

Would mean that the Assign If Expression & De Morgan's Identity refactorings are never shown.

### Skip refactorings

You can also choose to have Sourcery not review or refactor specific files, paths, or individual functions.

To ignore a path or a file, add the paths or files as items in a list underneath the `ignore` setting in the `.sourcery.yaml` file.

For example:

```
ignore:
  - data/*
  - .venv/*
  - '*_test.py'  # Note that any strings beginning with * must be quoted
```

If you want to just ignore a specific function you can add a `# sourcery skip` comment next to the line declaring the function and Sourcery will ignore that function.

```
def func(a,b): #sourcery skip
    if a < b:
        min_value = a
    else: 
        min_value = b
    c = min_value ** 2
    return c
```

If you want to ignore specific refactorings in a function you can add in `# sourcery skip: <refactoring id 1>, <refactoring id 2>` where each ID is from our list of available refactorings. 

```
def func(a,b):
    if a < b: #sourcery skip: inline-immediately-returned-variable
        min_value = a
    else: 
        min_value = b
    c = min_value ** 2
    return c
```

### Setting when Sourcery warns about quality issues

By default, Sourcery will show a warning if your quality score drops below 25. You can easily tweak this by changing the value of the `metrics: quality_threshold` value in the `.sourcery.yaml` file.

---

## Sign Up For More Features

Do you like how Sourcery improves your code bit by bit?
Sign up and get a 30 day free trial of the Pro features. (No automatic renewal, no credit card required.)

After [signing up](https://sourcery.ai/signup/?utm_source=VS-Code), login by
opening the command palette (Ctrl/Cmd+Shift+P) and executing the `Sourcery:
Login` command.

We also love to hear your feedback.

---

## Example Code

We've put together a handful of examples if you want to play around with Sourcery and see a bit more what it can do:

```
def list_comprehension(list, filter, func):
    new_list = list()
    for i in list:
        if filter(i):
            new_list.append(func(i))
    return new_list


def augmented_assignment():
    a = 0
    a = a + 1
    print(a)


def sort_out_return():
    if something == other_thing:
        return True
    return False


def dictionary_get():
    dictionary = {}
    data = ""
    if "message" in dictionary:
        data = dictionary["message"]
```

Here is an example where Sourcery would chain together multiple refactorings:

```
def enable_local(self, opt):
  if opt == ECHO:
    return True
  elif opt == SGA:
    return True
  else:
    return False


def __getstate__(self):
  state = {}
  state['min'] = self.min
  state['max'] = self.max
  return state
```

Copy these examples into a Python file to see how Sourcery would handle them.


## Privacy / Security

All of the analysis we do on your code is done fully locally. We never see any of your code or pass it back to our servers in any way. The only thing we collect is some basic analytics about the types of suggestions we make, and information about exceptions in Sourcery. 

---

## About us

We're a small team out of London trying to make it easier for everyone to write brilliant code. Follow us on [Twitter](https://twitter.com/sourceryai) or visit our [blog](https://sourcery.ai/blog) to keep up with updates.

---

## Licensing

This repository includes source code as well as packaged binaries. The MIT license only applies to the source code, not the binaries.
