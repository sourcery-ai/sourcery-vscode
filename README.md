# Sourcery VS Code Extension

[Sourcery](https://sourcery.ai) is an AI-powered coding assistant which helps you write better Python code faster.
 It works by providing refactoring suggestions on the fly that you can instantly integrate into your code.

This extension is currently in beta - please raise any problems or feedback as issues.

## Installation

1. Open VS Code and press `Ctrl+P` (`Cmd+P` on Mac) then paste in `ext install sourcery.sourcery` and press `Enter`. 
2. Click [here](https://sourcery.ai/download/?editor=vscode) to get a free token and copy it to your clipboard.
3. Search for `sourcery` in the VS Code settings and enter the token into the ```Sourcery Token``` field.

## How it works

Sourcery scans the Python file that you have open in your editor. Refactoring suggestions are 
underlined and listed in the Problems window. 

You can hover over a suggestion to see a diff of the changes.

To implement the suggestion use the Quick Fix from either the Problems window or the lightbulb in the code editor.

If you don't like the suggestion there is a quick fix to disable Sourcery for the function, or you can add 
```# sourcery off``` as a comment on that function.

## GitHub Integration

Sourcery is also available as a Github bot that can automatically refactor pull requests on selected repositories.
[Try it out now!](https://sourcery.ai/github/).

## About us

Sourcery is built by a small team of two developers based in London. Our aim is to help everyone write brilliant code.
Follow us on [Twitter](https://twitter.com/sourceryai) or visit our [blog](https://sourcery.ai/blog) to keep up with updates.

## Licensing

This repository includes source code as well as packaged binaries. The MIT license only applies to the source code, not the binaries.