# Welcome to Sourcery! We're here to be your pair programmer anytime you're
# working in VS Code.

# To get started log into your Sourcery account. Click on the Sourcery logo
# (the hexagon) on your VS Code sidebar and click the login button, or open
# the command palette (Ctrl/Cmd+Shift+P) and execute `Sourcery: Login`.

# Sourcery works in 2 ways:
# 1. A cloud-based AI powered coding assistant allowing you to ask it
#    questions, write new code, and interact with existing code. To get 
#    started opt in via the Sourcery sidebar.
# 2. Local analysis to give you instant suggestions for improving your
#    Python, JavaScript, and TypeScript code.

def days_between_dates(date1, date2):
    d1 = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
    d2 = datetime.datetime.strptime(date2, '%Y-%m-%d').date()
    delta = d2 - d1
    return delta.days

# Let's start with the coding assistant:
# Above each function you'll see a few commands - these are Code Lenses that
# you can use to interact with Sourcery. Try clicking on "Ask Sourcery" and
# asking it to update the code to use `dateutil`. The answer will appear in
# the Sourcery sidebar chat.

# With the Ask Sourcery command or the chat in the sidebar you can ask Sourcery
# questions, have it write new code for you, or update existing code.

# Sourcery also has a series of "recipes" to do different things with code.
# Try clicking the Generate Docstrings lens above this next function:

def calculate_weighted_moving_average(prices, weights):
    if not prices or not weights:
        raise ValueError("Both prices and weights must be provided.")
    
    if len(weights) > len(prices):
        raise ValueError("Length of weights must be less than or equal to length of prices.")
    
    total_weight = sum(weights)
    normalized_weights = [w / total_weight for w in weights]
    
    wma = []
    for i in range(len(prices) - len(weights) + 1):
        weighted_sum = sum(prices[i + j] * normalized_weights[j] for j in range(len(weights)))
        wma.append(weighted_sum)
    
    return wma

# Now try clicking Generate Tests or Explain Code for the same function!

# There are also recipes for Optimizing Performance and Simplifying Code.
# You can access these by clicking Ask Sourcery and choosing them from the 
# dropdown or by selecting a section of code and clicking the recipe button 
# in the sidebar.

# In your code you'll also see sections start to get underlined.
# This means Sourcery has a suggestion to improve it.

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
#    This tells Sourcery to never suggest this type of suggestion. This config
#    is stored in a configuration file on your machine.

# 3) Click on the Sourcery button in the Status Bar (typically the bottom of
#    the VS Code window) to bring up the Sourcery Hub. Click on "Settings" and
#    then you can toggle individual rule types on or off

# For more details check out our documentation here:
# https://docs.sourcery.ai/

# If you want to play around a bit more, here are some more examples of Sourcery's in-line suggestions.
# These include cases where Sourcery has chained together suggestions to come
# up with more powerful refactorings.

def find_more(magicks):
    powerful_magic = []
    for magic in magicks:
        if not is_powerful(magic):
            continue
        powerful_magic.append(magic)
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
