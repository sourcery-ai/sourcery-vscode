

# Sourcery Installation

1. Go to https://sourcery.ai/download/?editor=vscode to get a free token.
2. Enter the token into the box above, or search for `sourcery` in the 
   settings and enter the token into the `Sourcery Token` field.



# How it works

Sourcery scans the Python file that you have open in your editor. Refactoring 
suggestions are underlined and listed in the Problems window. 

You can hover over a suggestion to see a diff of the changes.

To implement the suggestion use the Quick Fix from either the Problems window
or the lightbulb in the code editor.

If you don't like the suggestion there is a quick fix to disable it. This will
add a comment to the function of the form `# sourcery skip: refactoring-type`.
You can also disable Sourcery completely for that function by adding a
`# sourcery skip` comment.

To further configure Sourcery you can add a `.sourcery.yaml` file to the root
directory of your project. Configuration can be added here to ignore files or
paths, and to disable types of refactoring. Here's some example config:

# Paths to ignore from Sourcery refactorings
#
#
ignore:
    - example/*

# Refactoring config
refactor:
  # Refactoring ids to skip
  #
  # These refactorings will never be suggested by Sourcery
  skip:
    - merge-nested-ifs


This extension is currently in beta - please raise any problems or feedback as
issues at https://github.com/sourcery-ai/sourcery-vscode/issues.
