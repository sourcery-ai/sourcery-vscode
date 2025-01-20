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

**[WEBSITE](https://sourcery.ai/) | [DOCS](https://docs.sourcery.ai/Welcome/) | [BUGS](https://github.com/sourcery-ai/sourcery/issues)**

Sourcery is your pair programmer that reviews and enhances your code in real-time. With intelligent code reviews and an AI chat assistant that understands your code, you can ship better code faster.

![Sourcery in VS Code](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_VS_Code_Example.gif)

---

## Sourcery

Sourcery is a VS Code extension to help you move faster and ship code with confidence. Sourcery gives you code reviews anytime you want, so you can get feedback before you need to open a PR. Plus Sourcery's coding assistant helps you speed up repetitive tasks while you work.

Here are some of the features Sourcery offers to help improve your code:

- [Chat with an AI that knows about your code](#chat)
- [Code reviews anytime, in IDE](#code-reviews-on-demand)
- [GitHub & GitLab Pull Request reviews](#github-pull-request-review)
- [Real-time refactoring suggestions](#real-time-refactoring-suggestions)
- [Continuous code quality feedback](#continuous-code-quality-feedback)


To start using Sourcery on your code, check out our [Getting Started guide](https://docs.sourcery.ai/getting-started/).

Check out our [documentation](https://docs.sourcery.ai/Welcome/) for more information on how to use Sourcery.

Sourcery is free to use for open source projects. 

To use Sourcery on non open-sourced projects you'll need a Sourcery Pro subscription. To get a 14 day free trial to Sourcery Pro, **[sign up for an account on the Sourcery site](https://app.sourcery.ai/dashboard/subscription?utm_source=vscode_marketplace&utm_medium=web&utm_campaign=vscode_marketplace)**.

---

## Features

### Chat

![Generating documentation](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/docstring_generation.png)

Talk with an AI that knows about your code. Select code to add it to context and ask questions or ask for improvements. Apply code changes with a single click.

Sourcery Chat comes with in-built recipes to:
- Generate diagrams: No need to spend hours manually creating diagrams. Sourcery can generate them for you in Mermaid format - grab the code or view it as an image.
- Generate Tests: Generate comprehensive unit tests for your code.
- Generate docstrings: Sourcery can generate docstrings for your code, copying the style from your existing docstrings. Add them to your code with a single click.
- Explain code: Sourcery can explain your code, point out how it works and anything unusual or not idiomatic.

### Code reviews on demand

![Sourcery Code Reviews](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/code_review.png)

Get feedback on your code anytime you want. Sourcery can review your code directly in your IDE and give you instant actionable feedback.
Review your current file, your uncommitted changes, or compare any two Git branches. Individual review comments are shown inline in your code, along with suggested fixes if applicable.


### GitHub & GitLab Pull Request Review

![Sourcery Reviewing GitHub PRs](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_Code_Review.gif)

Sourcery can help you speed up code reviews and clean up every new commit by automatically reviewing each of your GitHub pull requests. This also gives you a PR summary, can generate PR titles, and posts a reviewers guide to the PR, including diagrams and a breakdown of the changes.

To get started, add [Sourcery to your GitHub repo](https://github.com/apps/sourcery-ai/installations/new) or [GitLab project](https://app.sourcery.ai/login?connection=gitlab). Sourcery will then start reviewing every new pull request automatically!

### Real-time refactoring suggestions

![Refactoring Code with Sourcery](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/main/assets/Sourcery_VS_Code_Refactoring.gif)

While you work, Sourcery will review all of the Python, JavaScript, and TypeScript files you have open and look for opportunities to clean up and improve your code. Once Sourcery finds a potential improvement it will underline that section of your code.

Hover your mouse over the underlined section of code to see the changes Sourcery suggests and to see a diff of the proposed change.

To make the change, just bring up the quick fix menu and choose to accept the change. Sourcery will then apply the change to your code. We're constantly adding new improvements and rules that Sourcery can make. The current list of rules Sourcery checks for is available **[here](https://docs.sourcery.ai/refactorings/)**.

The commands to bring up the quick fix menu depend on your OS & region, but generally they are:


 | OS | Keyboard Shortcut  |
| --- | --- |
| Mac | Command . |
| Windows | Ctrl . |
| Linux | Ctrl . |

Sourcery reviews all of the files you have open. You can get an overview of all the suggestions Sourcery has in the Problem window.

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


---

## About us

We're a small team out of London trying to make it easier for everyone to write brilliant code. Follow us on [Twitter](https://twitter.com/sourceryai) or visit our [blog](https://sourcery.ai/blog) to keep up with updates.

---

## Licensing

This repository includes source code as well as packaged binaries. The MIT license only applies to the source code, not the binaries.
