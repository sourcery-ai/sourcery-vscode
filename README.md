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

Sourcery is the pair programmer who will help you improve your code anytime you're working in Python. It reviews and improves your code automatically so you can spend more time focused on writing new code and less time cleaning things up.

![Sourcery in VS Code](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_VS_Code_Example.gif)

---

## Sourcery

Sourcery is a VS Code extension to help make all of your Python code cleaner and more readable. Quickly find areas **where your code could be refactored**, see **instant suggestions for improvement**, and understand how new changes impact your **code quality**. 

Here are some of the features Sourcery offers to help improve your code:

- [Real-time refactoring suggestions](#real-time-refactoring-suggestions)
- [Set up your own rules - or use public rulesets](#set-up-your-own-rules---or-use-pulic-rulesets)
- [Continuous code quality feedback](#continuous-code-quality-feedback)
- [Multi-file analysis](#multi-file-analysis)
- [Duplicate code detection](#duplicate-code-detection)
- [Sourcery CLI, CI, & Pre-Commit Hook options](#sourcery-cli)
- [GitHub Pull Request reviews](#github-pull-request-review)


To start using Sourcery on your code, check out our [Getting Started guide](https://docs.sourcery.ai/getting-started/).

---

## Features

### Real-time refactoring suggestions

![Refactoring Code with Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_VS_Code_Refactoring.gif)

While you work, Sourcery will review all of the Python files you have open and look for opportunities to clean up and improve your code. Once Sourcery finds a potential improvement it will underline that section of your code.

Hover your mouse over the underlined section of code to see the changes Sourcery suggests and to see a diff of the proposed change.

To make the change, just bring up the quick fix menu and choose to accept the change. Sourcery will then apply the change to your code. We're constantly adding new improvements and rules that Sourcery can make. The current list of rules Sourcery checks for is available **[here](https://docs.sourcery.ai/refactorings/)**.

The commands to bring up the quick fix menu depend on your OS & region, but generally they are:


 | OS | Keyboard Shortcut  |
| --- | --- |
| Mac | Command . |
| Windows | Ctrl . |
| Linux | Ctrl . |

Sourcery reviews all of the Python files you have open. You can get an overview of all the suggestions Sourcery has in the Problem window.

### Set up your own rules - or use public rulesets

Sourcery is widely extendable so that you can have it check for whatever types of best practices you care about within your code. 

Sourcery reads rules from a .sourcery.yaml configuration file that you can set up in your project directory - then it will look to apply those rules across the full project. To get started we’ve [set up a quick tutorial](https://docs.sourcery.ai/Tutorials/Custom-Rules/) and you can [dive deeper in our full documentation](https://docs.sourcery.ai/Reference/Custom-Rules/pattern-syntax/)

![Sourcery Custom Rules](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/custom-rules.gif)

You can also opt into publicly available sets of rules to help improve your code. [Check out the Google Python Style Guide](https://docs.sourcery.ai/Reference/Custom-Rules/gpsg/) and see how you can add it to Sourcery.

### Continuous code quality feedback

![Code Quality Metrics in Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Metrics_VS_Code.gif)

Sourcery gives each of your functions a quality score ranging from 0% (bad) - 100% (good) and also gives you sub-scores on Method Length, Complexity, and Working Memory so that you can figure out how to structure your code as cleanly as possible.

**Method Length** is a metric is a measure of how long each method is on average. It is based on the number of nodes in the method's Abstract Syntax Tree.

**Complexity** is a measure of how difficult your code is to read and understand. It is based on these principles:

- Each break in the linear flow of the code makes it harder to understand
- When these flow-breaking structures are nested they are even harder to understand

**Working Memory** is a measure of the number of variables that need to be kept in your working memory as you read through the code.

Sourcery will warn you if your overall quality score for a function falls below 25%.

### Multi-File Analysis

![Multi-File Analysis & Refactoring in Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Example_Full_Project_Scan_VS_Code.gif)

You can use Sourcery to review a single file, a folder, or your whole project at once.

Right-click on any item in the Explorer window and select "Sourcery → Scan for Refactorings". Sourcery will show you a notification when the scan is done & will show all of the suggestions it found in the Problems window.

Multi-File Analysis requires a Sourcery Pro subscription. To get a month free access to Sourcery Pro, **[sign up for an account on the Sourcery site](https://sourcery.ai/signup/?utm_source=VS-Code)**.

### Duplicate Code Detection

![Duplicate Code Detection in Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Example_Duplicates_VS_Code.gif)

Sourcery can help you find duplicate code and near-duplicate code across your whole project.

Right-click on any item in the Explorer window and select "Sourcery → Detect Clones". Sourcery will show you a notification when it's done scanning for clones & will show you all of the instances of duplication it found in the Problems window.

By default, Sourcery will flag items where at least 3 lines are duplicates or near-duplicates that occur at least twice in the scanned files.

Duplicate Code Detection requires a Sourcery Pro subscription. To get a month free access to Sourcery Pro, **[sign up for an account on the Sourcery site](https://sourcery.ai/signup/?utm_source=VS-Code)**.

### Sourcery CLI

If you want to clean up a bigger portion of legacy code, Sourcery CLI comes in handy.

- Get started with `pip install sourcery-cli`
- With the `sourcery review` command, you can scan multiple files or directories for refactorings.
- With the `-in-place` option, you can apply the suggested refactorings immediately.

![Sourcery CLI](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/sourcery-cli.gif)

With Sourcery CLI, you can also integrate Sourcery with your favorite tools.

#### CI / Pre-Commit Hook options: 

You can use Sourcery to review every new bit of code you and your team are working on by adding Sourcery into your CI or running it as a Pre-Commit Hook.

Sourcery will review every new change and you can set it up to either automatically make changes to your code when it detects opportunities to refactor, or you can just have it notify you when it finds refactorings.

Sourcery is fully free for Open Source projects, the CI and Pre-Commit Hook options require a Sourcery Team subscription for private projects. **[You can sign up for a Team plan here**.](https://sourcery.ai/team/)

### GitHub Pull Request Review

![Sourcery Reviewing GitHub PRs](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_GitHub-Refactor-Branch.gif)

Sourcery can help you speed up code reviews and clean up every new commit by automatically reviewing each of your GitHub pull requests.

To get started, add [Sourcery to your GitHub repo](https://github.com/apps/sourcery-ai/installations/new). Sourcery will then start reviewing every new pull request automatically!

---

## Configuring Sourcery

Not everyone's coding style is the same, so we know you won't always want to accept every refactoring Sourcery suggests.

Sourcery reads [configuration settings from two sources](https://docs.sourcery.ai/Reference/Configuration/Sources/#configuration-sources):

- a [`.sourcery.yaml` file](https://docs.sourcery.ai/Reference/Configuration/sourcery-yaml/) in the project directory; and
- a [user-specific config file](https://docs.sourcery.ai/Reference/Configuration/Sources/#user-configuration-file-system-locations).

You can use the project-specific config file to set project-specific settings, and the user-specific config file to set settings that apply to all projects.

The config file uses YAML syntax. If you are new to YAML check out "[Learn YAML in 5 minutes](https://www.codeproject.com/Articles/1214409/Learn-YAML-in-five-minutes)".

Here is the default set of values set for the file. If a config file isn't set or if a setting isn't specified then Sourcery will use these values:

```yaml
ignore: []

rule_settings:
  enable: [default]
  disable: []
  rule_types:
    - refactoring
    - suggestion
    - comment
  python_version: '3.9'

rules: []

metrics:
  quality_threshold: 25.0

github:
  labels: []
  ignore_labels:
    - sourcery-ignore
  request_review: author
  sourcery_branch: sourcery/{base_branch}

clone_detection:
  min_lines: 3
  min_duplicates: 2
  identical_clones_only: false

proxy:
  no_ssl_verify: false
```

You can easily configure Sourcery to:

- [Only show certain types of suggestions](#choosing-which-rules-to-be-shown)
- [Not show suggestions on certain files, paths, or functions](#skip-suggestions)

### Choosing which rules to be shown

You can choose to have Sourcery never show you a specific type of rule by adding it to a list under the `refactor: skip` section of the .sourcery.yaml file. Just add in the rule ID for the rule you don't want to see and Sourcery will stop suggesting it.

Individual ids are displayed in the plugin suggestions and GitHub Bot comments for easy lookup or you can find a full list in the [refactorings section](https://docs.sourcery.ai/refactorings/) of the docs.

For example:

```
refactor:
  skip:
    - assign-if-exp
    - de-morgan
```

Would mean that the Assign If Expression & De Morgan's Identity refactorings are never shown.

To make this even easier, we’ve set up the Sourcery Hub. Click on the Sourcery button in the status bar to bring up the Hub, click on settings, and you can toggle on and off individual types of suggestions

### Skip suggestions

You can also choose to have Sourcery not review specific files, paths, or individual functions.

To ignore a path or a file, add the paths or files as items in a list underneath the `ignore` setting in the `.sourcery.yaml` file.

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
