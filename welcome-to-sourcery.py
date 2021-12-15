


# Welcome to Sourcery! 

# We're here to help your write cleaner, more Pythonic code. 
# You should start to notice lines of your code being 
# underlined - this means Sourcery has a suggestion.

# Let's start with something simple:

def refactoring_example(spellbook):
    result = []
    for spell in spellbook:
        if spell.is_awesome:
            result.append(spell)
    return result

# Hover over the underlined section to see details of the 
# changes including a diff. 

# You can quickly accept Sourcery's changes with the quick
# fix action. Put your cursor on the highlighted line and 
# click on the lightbulb. Or use the quick-fix hotket
# (Ctrl .) or (Cmd .)  and then choose "Convert for loop..."

# Let's take a look at another example:

def assess_fruit(self, fruit_bowl):
  happiness = 0
  for fruit in fruit_bowl:
    if isinstance(fruit, Apple):
      yumminess = fruit.size * fruit.ripeness**2
      if fruit.variety in TASTY_APPLES:
        happiness += self.hunger * yumminess
  return happiness

# Here Sourcery suggests making multiple improvements to
# this function at once. But what if we don't want to 
# make the change Sourcery suggests? 

# You can skip/ignore changes from Sourcery in a few ways:
# 1) In the quick fix menu choose the "Sourcery - Skip..."
# option
# 2) After declaring the function add in # sourcery skip
# to tell Sourcery to ignore the function like this:

def assess_fruit(self, fruit_bowl): # sourcery skip
  happiness = 0
  for fruit in fruit_bowl:
    if isinstance(fruit, Apple):
      yumminess = fruit.size * fruit.ripeness**2
      if fruit.variety in TASTY_APPLES:
        happiness += self.hunger * yumminess
  return happiness

# If you want Sourcery to ignore specific types of 
# refactoring suggestions you can add the refactoring
# id to the `# sourcery skip` and Sourcery will only
# not show you that refactoring. Let's look at just
# skipping the merge-nested-ifs refactoring in the
# previous example:

def assess_fruit(self, fruit_bowl):
  happiness = 0 # sourcery skip: merge-nested-ifs
  for fruit in fruit_bowl:
    if isinstance(fruit, Apple):
      yumminess = fruit.size * fruit.ripeness**2
      if fruit.variety in TASTY_APPLES:
        happiness += self.hunger * yumminess
  return happiness



# Bring up the problems pane (Ctrl/Cmd+Shift+M) to see
# all of Sourcery's suggestions at once.

# Sourcery also provides code metrics for each function to give 
# you insight into code quality - hover over the function 
# definition above to see this report.

# You can also have Sourcery review multiple files at once or 
# check for duplicate code across your project. Right click on
# any file or folder in the Explorer window, choose the 
# Sourcery menu item and choose "Scan for refactorings" or
# "Detect Clones". 

# Both of these advanced features require a Sourcery Pro
# subscription. But, you can get a 30 day  trial by 
# creating a free account at https://sourcery.ai/signup

# For more details check out our documentation here:
# https://docs.sourcery.ai/

# Now open up some Python files and look out for the suggestions!

# Or if you want to play around a bit more, here are some 
# more examples:


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
