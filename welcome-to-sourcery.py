
# Welcome to Sourcery!

# We're here to help you write cleaner, more Pythonic code.
# You should start to notice parts of your code being underlined.
# This means Sourcery has a suggestion.

def refactoring_example(spellbook):
    result = []
    for spell in spellbook:
        if spell.is_awesome:
            result.append(spell)
    print(result)

# Hover over the underlined code to see details of the changes including a diff.

# You can accept Sourcery's changes with the quick fix action. Put your cursor
# on the highlighted line and click on the lightbulb. 
# 
# Or use the quick-fix hotkey (Ctrl .) or (Cmd .)  and then choose 
# "Sourcery - Convert for loop...". This will instantly replace the code with 
# the improved version.

# The Problems pane (Ctrl/Cmd+Shift+M) shows all of Sourcery's suggestions.

# Sourcery also provides code metrics for each function to give you insight into
# code quality - hover over the function definition below to see this report.

def magical_hoist(magic):
    if is_powerful(magic):
        result = 'Magic'
    else:
        print("Not powerful.")
        result = 'Magic'
    print(result)

# What if we don't want to make the change Sourcery suggests?

# You can skip/ignore changes from Sourcery in a few ways:

# 1) In the quick fix menu choose "Sourcery - Skip suggested refactoring"
#    This adds a comment to the function telling Sourcery not to make the change.

# 2) In the quick fix menu choose "Sourcery - Never show me this refactoring"
#    This tells Sourcery to never suggest this type of refactoring. This config
#    is stored in a configuration file on your machine.

# You can also have Sourcery review multiple files at once or check for
# duplicate code across your project. Right click on any file or folder
# in the Explorer window, choose the Sourcery menu item and choose
# "Scan for refactorings" or "Detect Clones".

# Both of these advanced features require a Sourcery Pro subscription.
# You can get a 30 day trial by creating a free account at
# https://sourcery.ai/signup and entering your token into the Sourcery settings.

# For more details check out our documentation here:
# https://docs.sourcery.ai/

# Now open up some Python files and look out for the suggestions!

# Or if you want to play around a bit more, here are some more examples.
# These include cases where Sourcery has chained together suggestions to come
# up with more powerful refactorings.

def find_more(magicks):
    powerful_magic = []
    for magic in magicks:
        if not is_powerful(magic):
            continue
        powerful_magic.append(magicks)
    return powerful_magic


def is_powerful(magic):
    if magic == 'Sourcery':
        return True
    elif magic == 'More Sourcery':
        return True
    else:
        return False


def print_all(spells: list):
    for i in range(len(spells)):
        print(spells[i])
