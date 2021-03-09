

# Sourcery Installation

# 1. Go to https://sourcery.ai/download/?editor=vscode to get a free token.
# 2. Enter the token into the box above, or search for `sourcery` in the
#    settings and enter the token into the `Sourcery Token` field.


# To check Sourcery is working, save this file and then look for the underlined
# `new_list = []` in the function below.
# If you hover over it you should see a diff, with Sourcery suggesting the 
# `list-comprehension` refactoring. You can apply the suggestion by taking the
# associated quick-fix action. Put the cursor on the line and either click on
# the lightbulb icon or use the hot-key (Cmd+. or Ctrl+. by default).
#
# All of the suggestions Sourcery has found
# will also appear in the Problems pane.

def filter_list(list, filter, func):
    new_list = []
    for i in list:
        if filter(i):
            new_list.append(func(i))
    print("List filtered")
    return new_list

# Sourcery also provides code metrics for each function to give you insight on
# code quality - hover over the `filter_list` definition above to see this report.


# Sourcery can also chain together several changes to make a larger one.
def enable_local(self, opt):
  if opt == ECHO:
    return True
  elif opt == SGA:
    return True
  else:
    return False





# For more detail you can check out our documentation here:
# https://github.com/sourcery-ai/sourcery/wiki/Sourcery-Tutorial

