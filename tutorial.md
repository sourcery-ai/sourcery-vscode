# Writing your first custom rules

By the end of this tutorial you will have written two custom Sourcery rules and
used them to review your code.

## Prerequisites

- You have installed Sourcery in your [IDE](../getting-started.md)

## Introduction

Have you ever seen the same code smell come up again and again in different code
reviews? Wouldn't it be great if you could write a rule to make sure that it
could never happen again?

Sourcery can be extended with your own custom rules that allow you to do this.

## Creating your first rule

Open or create `.sourcery.yaml` in your IDE and paste your first rule:

```yaml
rules:
  - id: raise-not-implemented
    description: NotImplemented is not an Exception, raise NotImplementedError instead
    pattern: raise NotImplemented
```

Save this file, then open a new Python file and paste this problematic code:

```python
class ExampleBaseClass:
    def abstract_method(self):
        raise NotImplemented
```

Sourcery highlights the line where this issue occurs. Hover your mouse on the
highlight to see the problem:

![NotImplemented Comment](../img/NotImplemented-Comment.png)

## Including a replacement in your rule

This is really nice, but what would be even nicer is to have Sourcery fix this
for you. Update your `.sourcery.yaml` rule by adding a `replacement` key:

```yaml
rules:
  - id: raise-not-implemented
    description: NotImplemented is not an Exception, raise NotImplementedError instead
    pattern: raise NotImplemented
    replacement: raise NotImplementedError
```

Save this file, return to the example code and hover over the highlight:

![NotImplemented Suggestion](../img/NotImplemented-Suggestion.png)

Not only is the issue highlighted but the fix is suggested too!

Let's accept the suggestion:

1. Move the cursor to the broken code, this will show the lightbulb 💡
2. Click the lightbulb to show Sourcery options
3. Select the first option

![NotImplemented Quickfix](../img/NotImplemented-Quickfix.png)

and Sourcery fixes our code:

![NotImplemented Fixed](../img/NotImplemented-Fixed.png)

Congratulations, you've written your first rule!

## Dissecting a rule

Let's look closer at our rule:

```yaml
rules:
  - id: raise-not-implemented
    description: NotImplemented is not an Exception, raise NotImplementedError instead
    pattern: raise NotImplemented
    replacement: raise NotImplementedError
```

Firstly, we can see that our rule lives inside a `rules` sequence. This can
contain multiple rules as we'll see later on.

Each rule has the following keys:

| Field       | Type   | Required | Description                                                    |
| ----------- | ------ | -------- | -------------------------------------------------------------- |
| id          | string | Required | Unique, descriptive identifier, e.g. `raise-not-implemented`   |
| description | string | Required | A description of why this rule triggered and how to resolve it |
| pattern     | string | Required | Search for code matching this expression                       |
| replacement | string | Optional | Replace the matched code with this                             |

## More powerful patterns using captures

Let's take it up a level. Add a second rule to `.sourcery.yaml`

```yaml
rules:
  - id: raise-not-implemented
    description: NotImplemented is not an Exception, raise NotImplementedError instead
    pattern: raise NotImplemented
    replacement: raise NotImplementedError

  - id: remove-open-r
    description: Files are opened in read mode `r` by default
    pattern: open(${file}, "r")
    replacement: open(${file})
```

The new feature here is that we are now using the capture `${file}` to match any
code that is used as the first argument to `open`. This captured code is then
used in the replacement.

Paste this code into your example file to see this in action:

```python
def print_sourcery_yaml():
    with open(".sourcery.yaml", "r") as f:
        print(f.read())
```

Now hover over the highlighted line:

![Hover remove open r](../img/RemoveOpenR-Hover.png)

Here we can see that `${file}` has captured `"sourcery.yaml"` and used it in the
replacement.

Finally use the quickfix lightbulb to fix your code.

![Fixed remove open r](../img/RemoveOpenR-Fixed.png)

Beautiful!

## Conclusion

You've written two rules; one that matches exact code, and a second that
captures code to reuse it in the replacement.

Now go forth and write your own rules. Enjoy!

## Next Steps

- Check out our
  [rules documentation](../Configuration/Project-Settings.md#add-custom-rules)
- Run these rules on the [command line](../Command-Line-Interface/index.md)
