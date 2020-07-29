# Welcome to Sourcery!

# Once you've added in your Sourcery token, it will start working away to find
# refactoring recommendations for you.


# To check Sourcery is working, look for the underlined `if a:` in this function.
# If you hover over it you should see a diff, with Sourcery suggesting the
# `merge-nested-ifs` refactoring. All of the suggestions Sourcery has found will also
# appear in the Problems pane.

def merge_nested_if(a, b):
    if a:
        if b:
            return c

# If you take the quick fix action to `merge nested if conditions` suggested on the code above
# you should end up with the code below:

def merge_nested_if(a, b):
    if a and b:
        return c

# Here are some more examples of what Sourcery can do:


def list_comprehension(list, filter, func):
    new_list = list()
    for i in list:
        if filter(i):
            new_list.append(func(i))
    return new_list


def sort_out_return():
    if something == other_thing:
        return True
    return False


def dictionary_get():
    dictionary = {}
    data = ""
    if "message" in dictionary:
        data = dictionary["message"]


# This method has been commented to skip a specific refactoring.
# If you remove the comment Sourcery will suggest the `use-any` refactoring.

def convert_to_any():  # sourcery skip: use-any
    found = False
    for thing in things:
        if do_something_serious(thing):
            found = True
            break

# There are quick fix actions to skip the specific suggestions or all suggestions.
# You can also turn off refactorings globally through adding a `.sourcery.yaml` file
# to the root of your project using the following settings:

"""
# Refactoring config
refactor:
  # Refactoring ids to skip
  #
  # These refactorings will never be suggested by Sourcery
  skip:
    - use-any
"""

# We also have a new feature to show code metrics right in the IDE
# Just add the config below to your `.sourcery.yaml` file.

"""
# Code Metrics configuration - VS Code extension (beta)
metrics:
  # This enables showing Sourcery code metrics in the plugin.
  #
  # These are shown at the method level when hovering the mouse
  # over the method name.
  #
  enabled: true
  # The quality score is a mark out of 10.
  #
  # Methods with a quality lower than this threshold will be flagged
  # as warnings.
  #
  quality_threshold: 5.0
"""

# Once this is enabled yuo can hover over the line where we define the function
# to get a view of its complexity, length and the overall quaility score.

# Here's an intentionally low quality function (from the Gilded Rose refactoring kata)
# If you turn metrics on you should see the function definition underlined, with a warning
# about low quality.

def update_quality(self):
    for item in self.items:
        if item.name != "Aged Brie" and item.name != "Backstage passes to a TAFKAL80ETC concert":
            if item.quality > 0:
                if item.name != "Sulfuras, Hand of Ragnaros":
                    item.quality = item.quality - 1
        else:
            if item.quality < 50:
                item.quality = item.quality + 1
                if item.name == "Backstage passes to a TAFKAL80ETC concert":
                    if item.sell_in < 11:
                        if item.quality < 50:
                            item.quality = item.quality + 1
                    if item.sell_in < 6:
                        if item.quality < 50:
                            item.quality = item.quality + 1
        if item.name != "Sulfuras, Hand of Ragnaros":
            item.sell_in = item.sell_in - 1
        if item.sell_in < 0:
            if item.name != "Aged Brie":
                if item.name != "Backstage passes to a TAFKAL80ETC concert":
                    if item.quality > 0:
                        if item.name != "Sulfuras, Hand of Ragnaros":
                            item.quality = item.quality - 1
                else:
                    item.quality = item.quality - item.quality
            else:
                if item.quality < 50:
                    item.quality = item.quality + 1


# Sourcery will not make a refactoring if it would mean removing a comment.
# Remove the comment in the method below to see what happens!
def count_sheeps(arrayOfSheeps):
  num_of_sheep = 0 # Remove this comment!
  for i in range(len(arrayOfSheeps)):
    if arrayOfSheeps[i] == True:
      num_of_sheep += 1
  return num_of_sheep