

# Sourcery Installation

# 1. Go to https://sourcery.ai/download/?editor=vscode to get a free token.
# 2. Enter the token into the box above, or search for `sourcery` in the
#    settings and enter the token into the `Sourcery Token` field.


# Welcome to Sourcery! Once you've added the token, look for the
# underlined `result = []` below. This is a suggestion from Sourcery.
# Hover over it to see details of the changes including a diff. 

def refactoring_example(spellbook):
    result = []
    for spell in spellbook:
        if spell.is_awesome:
            result.append(spell)
    return result

# Apply the suggestion by taking the quick-fix action:
#   Put the cursor on the highlighted line and click the lightbulb or use the hotkey
#   (Ctrl + .) or (Cmd + .), then take the 'Convert for loop...' option.
#
# All of Sourcery's suggestions are shown in the Problems pane (Ctrl/Cmd+Shift+M).

# Sourcery also provides code metrics for each function to give you insight into
# code quality - hover over the function definition above to see this report.

# For more details check out our documentation here:
# https://github.com/sourcery-ai/sourcery/wiki/Sourcery-Tutorial

# Now open up some Python files and look out for the suggestions!

