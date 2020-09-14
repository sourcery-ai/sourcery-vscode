

# Sourcery Installation

# 1. Go to https://sourcery.ai/download/?editor=vscode to get a free token.
# 2. Enter the token into the box above, or search for `sourcery` in the
#    settings and enter the token into the `Sourcery Token` field.


# To check Sourcery is working, save this file and then look for the underlined 
# `if a:` in the function below.
# If you hover over it you should see a diff, with Sourcery suggesting the 
# `merge-nested-ifs` refactoring. All of the suggestions Sourcery has found 
# will also appear in the Problems pane.

def merge_nested_if(a, b):
    if a:
        if b:
            return c

# If you take the quick fix action to `merge nested if conditions` suggested 
# on the code above you should end up with the code below:

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


# And here Sourcery is chaining together several changes to make a larger one
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


# This method has been commented to skip a specific refactoring.
# If you remove the comment Sourcery will suggest the `use-any` refactoring.

def convert_to_any(): # sourcery skip: use-any
    found = False
    for thing in things:
        if do_something_serious(thing):
            found = True
            break

# There are quick fix actions to skip the specific suggestions or all 
# suggestions.
# You can also turn off refactorings globally through adding a `.sourcery.yaml` 
# file to the root of your project using the following settings:

"""
# Refactoring config
refactor:
  # Refactoring ids to skip
  #
  # These refactorings will never be suggested by Sourcery
  skip:
    - use-any
"""

# Sourcery will not make a refactoring if it would mean removing a comment.
# Remove the comment in the method below to see what happens!
def count_sheeps(arrayOfSheeps):
  num_of_sheep = 0 # Remove this comment!
  for i in range(len(arrayOfSheeps)):
    if arrayOfSheeps[i] == True:
      num_of_sheep += 1
  return num_of_sheep

# We also have a new feature to show code metrics right in the IDE

# Just hover over the line where a function is defined
# to get a view of its complexity, length, working memory usage and 
# the overall quaility score.

# These metrics can be switched off in the Sourcery VS Code configuration.
# Search for `sourcery` in the settings and switch off the 
# 'Sourcery Metrics Enabled` checkbox.

# Here's an intentionally low quality function which is flagged as a warning:

def example_function(condition, other_condition, third_condition, delimiter, extra_var):
    if condition:
        if other_condition and third_condition:
            seen = set()
            for (s, nbrs) in G.adjacency_iter:
                nbr_edges = [
                    (u, data)
                    for (u, datadict) in nbrs.items()
                    if u not in seen
                    for (key, data) in datadict.items()
                ]
                deg = len(nbr_edges)
                yield make_str(s) + delimiter + "%i" % deg
                for (u, d) in nbr_edges:
                    if is_valid(u):
                        if d is None:
                            yield make_str(u)
                        else:
                            yield make_str(u) + delimiter + make_str(d)
                seen.add(s)
    else:
        if other_condition and third_condition:
            seen = set()
            for (s, nbrs) in G.adjacency_iter:
                nbr_edges = [(u, d) for (u, d) in nbrs.items() if u not in seen]
                deg = len(nbr_edges)
                yield make_str(s) + delimiter + "%i" % deg
                for (u, d) in nbr_edges:
                    if is_valid(u):
                        if d is None:
                            yield make_str(u)
                        else:
                            yield make_str(u) + delimiter + make_str(d)
                seen.add(s)
    return Edges(seen, extra_var)


# The threshold at which a low quality score shows up as a warning is set
# at 25% by default. This can be altered on a project-by-project basis.
# Just add the config below to your `.sourcery.yaml` file.

"""
# Code Metrics configuration - VS Code extension (beta)
metrics:
  # These are shown at the method level when hovering the mouse
  # over the method name.
  #
  # The quality score is a percentage.
  #
  # Methods with a quality lower than this threshold will be flagged
  # as warnings. The default threshold is 25.0
  #
  quality_threshold: 25.0
"""


