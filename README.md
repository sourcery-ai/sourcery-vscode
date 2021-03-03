[twitter-shield]: https://img.shields.io/twitter/follow/SourceryAI?style=social
[twitter-url]: https://bit.ly/sourceryai-twitter
[github-shield]: https://img.shields.io/github/stars/sourcery-ai/sourcery?style=social
[github-url]: https://bit.ly/sourceryai-github
[vscode-shield]: https://img.shields.io/visual-studio-marketplace/r/sourcery.sourcery?logo=visual-studio-code&style=social
[vscode-url]: https://bit.ly/sourceryai-vscode

[![Github Repo][github-shield]][github-url]
[![VSCode Plugin][vscode-shield]][vscode-url]
[![Twitter Follow][twitter-shield]][twitter-url]

# Sourcery for VS Code

Sourcery is your personal coding assistant that helps you write better, cleaner, Python code. It suggests refactorings on the fly to instantly improve your code. 

![Sourcery in VS Code](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/master/assets/VS_Code_Refactorings.gif)

---

### Using Sourcery

Sourcery runs in the background whenever you're working on Python files. Keep an eye out for sections of your code underlined in blue - that means Sourcery has a suggestion!

Hover over a Sourcery suggestion to see a description of what Sourcery wants you to change along with the diff of the proposed changes. Then either use the quickfix menu (`Ctrl+.` or `Cmd+.` for most people) or click on the lightbulb icon to bring up the Sourcery menu and choose to accept or reject the changes.

Sourcery also provides quality metrics for every function you write (plus warnings for really bad code).

![Quality Metrics](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/master/assets/Hover_Over_Metrics_VS_Code.gif)

---

### Installation / Getting Started

- Navigate to the Extensions tab and search for the Sourcery extension
- Click the Install button on the right-hand side
- Once installed click [here](https://sourcery.ai/download/?editor=vscode) to get a free token and enter it into the provided dialog or straight into the Sourcery settings.

### Sourcery Pro

Looking for an even bigger quality boost for your code?

*Automatic method extraction*

Sourcery can find duplicate code or coherent blocks that should be extracted into a method. It will then do the extraction for you - all you need to do is name the method!

![Extract Method](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/master/assets/Extract_Method_VS_Code_Demo.gif)

*Multi file analysis & Duplicate analysis (beta):*

Right click on any file or folder in the Explorer and hover over the Sourcery menu to see some of our more advanced features. 

Choose "Scan with Sourcery" to have Sourcery analyse all of the files in that folder, not just your current folder. 

![Scan for refactorings](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/master/assets/VS_Code_Scan_for_Refactorings.gif)

Or choose "Detect Clones" to have Sourcery scan for duplicate sections of code across those files. 

![Detect duplicate code](https://raw.githubusercontent.com/sourcery-ai/sourcery-vscode/master/assets/Duplicate_Code_Detection_VS_Code.gif)

---

### Privacy / Security

All of the analysis we do on your code is done fully locally. We never see any of your code or pass it back to our servers in any way. The only thing we collect is some basic analytics about the types of suggestions we make, and information about exceptions in Sourcery. 

---

### About us

We're a small team out of London trying to make it easier for everyone to write brilliant code. Follow us on [Twitter](https://twitter.com/sourceryai) or visit our [blog](https://sourcery.ai/blog) to keep up with updates.

---

### Licensing

This repository includes source code as well as packaged binaries. The MIT license only applies to the source code, not the binaries.