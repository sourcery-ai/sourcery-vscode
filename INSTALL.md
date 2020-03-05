
# Sourcery VS Code Extension

Sourcery is an AI-powered coding assistant which helps you write better Python
code faster. It works by providing refactoring suggestions on the fly that you
can instantly integrate into your code.

This extension is currently in beta - please raise any problems or feedback as
issues at https://github.com/sourcery-ai/sourcery-vscode/issues.

# Installation

1. Go to https://sourcery.ai/download to get a free token and copy it to your 
   clipboard.
2. Enter the token into the box above, or search for `sourcery` in the 
   settings and enter the token into the `Sourcery Token` field.

# How it works

Sourcery scans the Python file that you have open in your editor. Refactoring 
suggestions are underlined and listed in the Problems window. 

You can hover over a suggestion to see a diff of the changes.

To implement the suggestion use the Quick Fix from either the Problems window
or the lightbulb in the code editor.

If you don't like the suggestion there is a quick fix to disable Sourcery for
the function, or you can add `# sourcery off` as a comment on that function.
