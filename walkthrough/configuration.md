# Project Settings

Sourcery reads project settings from `.sourcery.yaml` in the project directory.

The config file uses YAML syntax. If you are new to YAML check out
["Learn YAML in 5 minutes"](https://www.codeproject.com/Articles/1214409/Learn-YAML-in-five-minutes).

Here is the default set of values set for the file. If a config file isn't set
or if a setting isn't specified then Sourcery will use these values:

```yaml
ignore: []

refactor:
  include: []
  skip: []
  rule_types:
    - refactoring
    - suggestion
    - comment
  python_version: '3.9'

rules: []

metrics:
  quality_threshold: 25.0

clone_detection:
  min_lines: 3
  min_duplicates: 2
  identical_clones_only: false

github:
  labels: []
  ignore_labels: [sourcery-ignore]
  request_review: author
  sourcery_branch: sourcery/{base_branch}
```

Here is the full list of configurable settings

## Ignoring Paths or Files

Any path or file you specify to be ignored will be ignored both in your IDE & in
GitHub. You will not see refactoring suggestions in any of these files.

By default any files in the path `.github/workflows/*` will be ignored within
GitHub as third party GitHub applications can't update the workflows folder.

Add paths or files as items in a list underneath the `ignore` setting.

For example:

```yaml
ignore:
  - data/*
  - .venv/*
  - '*_test.py'  # Note that any strings beginning with * must be quoted
```

## Skipping Types of Refactorings

You can tell Sourcery to never suggest a specific refactoring type to you.
Specify a list of refactoring IDs under the `refactor - skip` section of the
config file.

Individual refactoring ids are displayed in the plugin suggestions and GitHub
Bot comments for easy lookup or you can find a full list in the
[refactorings section](https://docs.sourcery.ai/refactorings/index.md) of the docs.

For example:

```yaml
refactor:
  skip:
    - assign-if-exp
    - de-morgan
```

Would make it so Sourcery never shows you the
[Assign If Expression](https://docs.sourcery.ai/refactorings/assign-if-exp.md) and
[De Morgan's Identity](https://docs.sourcery.ai/refactorings/de-morgan.md) refactorings.

For more details on skipping or ignoring refactorings (including skipping single
instances of a refactoring) check out our section on
[customizing refactorings](https://docs.sourcery.ai/Customizing-Refactorings.md)

## Only applying certain types of Refactorings

You can tell Sourcery to only suggest specific refactoring types, ignoring all
others. Specify a list of refactoring IDs under the `refactor - include` section
of the config file. This configuration is mutually exclusive with `skip` - any
refactorings specified in `include` will override the `skip` configuration.

Skip comments in the source code ruling out specific instances of the
refactoring will still be respected.

Individual refactoring ids are displayed in the plugin suggestions and GitHub
Bot comments for easy lookup or you can find a full list in the
[refactorings section](https://docs.sourcery.ai/refactorings/index.md) of the docs.

For example:

```yaml
refactor:
  include:
    - assign-if-exp
```

Would make it so Sourcery only shows you the
[Assign If Expression](https://docs.sourcery.ai/refactorings/assign-if-exp.md) refactoring.

## Setting the Python version assumed by Sourcery

You can specify a version of Python that your project uses. Sourcery will use
this to ensure it doesn't offer any refactorings that require later versions of
Python.

To do this specify a `python_version` in the `refactor` section.

For example:

```yaml
refactor:
  python_version: '3.7'
```

Would make it show Sourcery did not show refactorings requiring Python version
3.8 or later (for example
[Use Named Expression](https://docs.sourcery.ai/refactorings/use-named-expression.md)).

## Setting the rule types

Sourcery provides code improvements via different types of rules:

- **refactorings**, which will not change the functionality of the code
- **suggestions**, which may address issues or improve design but could possibly
  change functionality in some instances,
- **comments**, which highlight a possible issue, but don't provide a specific
  fix.

You can configure which of these you want to see with the `rule_types` option in
the `refactor` section.

For example:

```yaml
refactor:
  rule_types:
    - refactoring
    - suggestion
```

## Add custom rules

You can add custom rules to enforce coding standards in your project.

Search for code using a `pattern` and optionally fix it with `replacement` code.

```yaml
rules:
  - id: not-implemented
    description: NotImplemented is not an Exception, raise NotImplementedError instead
    pattern: raise NotImplemented
    replacement: raise NotImplementedError
  - id: remove-open-r
    description: Files are opened in read mode `r` by default
    # This pattern uses a capture ${file} to capture the first argument
    pattern: open(${file}, "r")
    # The capture is substituted into the replacement
    replacement: open(${file})
```

### Rule schema

The following fields are supported in a rule:

| Field       | Type   | Required | Description                                                    |
| ----------- | ------ | -------- | -------------------------------------------------------------- |
| id          | string | Required | Unique, descriptive identifier, e.g. `raise-not-implemented`   |
| description | string | Required | A description of why this rule triggered and how to resolve it |
| pattern     | string | Required | Search for code matching this expression                       |
| replacement | string | Optional | Replace the matched code with this                             |

A pattern is valid Python code that can optionally contain captures like
`${name}` (captures get their names from regular expression captures). e.g.
`print(${name})`

A replacement is valid Python code that can optionally contain substitutions
that refer to captures declared in the pattern:
`print(${name}, file=sys.stderr)`

## Setting Metrics Thresholds

Sourcery's code quality metrics will show a warning in your IDE if the quality
score for a function drops below a certain threshold.

Note - You can control whether or not Sourcery's metrics are displayed in your
IDE by toggling the switch within the IDE plugin settings.

By default the warnings will appear if a function's score drops below 25.
Changing the value in the `metrics - quality threshold` section of the config
will change this threshold

For example:

```yaml
metrics:
  quality_threshold: 30.0
```

These warnings can be skipped in the same way as refactorings - by adding
`low-code-quality` to the list of skipped refactorings in the config file or by
adding a `# sourcery skip: low-code-quality` comment to a particular function.

## GitHub Specific Configuration Options

There are a number of GitHub specific configuration options you can set. All of
these are nested under the `github` section of the config file.

### Ignore Labels

You can set a configuration to ignore pull requests that have certain labels.

These labels are tracked as a list under `ignore_labels:` For example:

```yaml
github:
  ignore_labels:
    - sourcery-ignore
```

This configuration setting would ignore all new pull requests tagged with the
label `sourcery-ignore`

### Add Labels

You can set custom labels that will be attached to all pull requests created by
Sourcery.

These can be used to tell other automations to ignore Sourcery's PRs.

These labels are tracked as a list under `labels:` For example:

```yaml
github:
  labels:
    - build-ignore
```

### Request Reviews

You can automatically trigger Sourcery PRs to request a review from a certain
person. The possible set of values for this configuration are:

- `author` - The author of the original PR or the sender of the refactoring
  request. This is the default
- `none` - No review is requested
- `owner` - The owner of the base repository. This option is not valid for
  organizations
- `username` - A specific user
- `org/teamname` - A specific team within an organization

You can have one value that will apply to both origin and forked PRs:

```yaml
github:
  request_review: owner
```

Or you can specify separate values for origin and forked PRs:

```yaml
github:
  request_review:
    origin: owner
    forked: author
```

### Sourcery Branch Name

You can set a default name for the branch of Sourcery pull requests.

This setting must contain \`{base_branch} which will be replaced with the branch
name on theoriginal pull request.

For example:

```yaml
github:
  sourcery_branch: sourcery/{base_branch}
```

## Advanced Features

For refactorings related to the detect clones feature please see our section on
[Advanced Features](https://docs.sourcery.ai/Advanced-Features.md)
