## Sourcery - Your Code Reviewer & Coding Assistant

Sourcery works in 2 ways:
1. Gives you code reviews while you work. Anytime you want a review just ask Sourcery and it will give you feedback like you'd expect from a peer review.
2. Acts as an AI powered pair programmer allowing you to ask it questions, write new code, and interact with existing code

Let's take a look at how you can interact with it in VS Code

### Code reviews

Sourcery can review your code directly in your IDE anytime you'd like some feedback. 

Click the Sourcery logo in the sidebar to open the coding assistant and bring up the code review panel.

Then choose the context of the code you want to review, click review, and wait for Sourcery's feedback.

To make the most of Sourcery's reviews you can also add Sourcery to your GitHub or GitLab repos.

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

