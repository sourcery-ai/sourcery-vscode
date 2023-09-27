## Using Sourcery as Your Pair Programmer

Sourcery works in 2 ways:
1. Gives you instant suggestions for improvements and refactorings to your Python, JavaScript, and TypeScript code.
2. Acts as an AI powered pair programmer allowing you to ask it questions, write new code, and interact with existing code

Let's take a look at how you can interact with it in VS Code

### In the tutorial

Once you open the tutorial you should see this example:

```python
def days_between_dates(date1, date2):
    d1 = datetime.datetime.strptime(date1, '%Y-%m-%d').date()
    d2 = datetime.datetime.strptime(date2, '%Y-%m-%d').date()
    delta = d2 - d1
    return delta.days
```

Above the function you'll see a few commands - these are Code Lenses that you can use to interact with Sourcery.  Try clicking the "Ask Sourcery" Code Lens and asking it to update the code to use `dateutil`. The answer will appear in the Sourcery sidebar chat.

![Sourcery updating code](Ask_Sourcery.gif)

### More ways Sourcery can help

Sourcery can interact with your code in a number of other ways. On the same function try clicking the `Generate Docstrings`, `Generate Tests`, and `Explain Code`Code Lenses.

