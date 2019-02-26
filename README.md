# Flow for Visual Studio Code
[![Backers on Open Collective](https://opencollective.com/flow-for-vscode/backers/badge.svg)](#backers)
 [![Sponsors on Open Collective](https://opencollective.com/flow-for-vscode/sponsors/badge.svg)](#sponsors) 

This extension adds [Flow](https://flow.org/) support for VS Code. Flow is a static type checker, designed to find type errors in JavaScript programs. Follow the official guide to [get started](https://flow.org/en/docs/getting-started/).

<p align="center">
  <img src="https://github.com/flowtype/flow-for-vscode/raw/master/readme/flow-main.gif"/>
</p>

Want to help make Flow in VS Code really shine? We're looking for help on moving to the new [flow-language-server support in flow](https://github.com/flowtype/flow-language-server). This means the flow core team would add features, and this extension will get them for _almost free_. If this is you, you can get [set up for development](https://github.com/flowtype/flow-for-vscode/blob/master/CONTRIBUTING.md) easily.

## Installation

Search for "Flow Language Support" in the VS Code extensions panel or install through [the marketplace](https://marketplace.visualstudio.com/items?itemName=flowtype.flow-for-vscode).

## Setup
* Make sure you have a `.flowconfig` file in your workspace.
* Make sure you are able to run the `flow` command from the command line (or see [Configuration](#configuration) to customize the command or use NPM packaged flow).
* Set `javascript.validate.enable` option to `false` **or** completely disable the built-in TypeScript extension for your project (see gif below):

<p align="center">
  <img src="https://github.com/flowtype/flow-for-vscode/raw/master/readme/flow-disable-tsc.gif"/>
</p>

## Configuration
You can specify a configuration by amending the VS Code `settings.json` file. Access this through Preferences → Settings. You must reload VS Code after installing this extension for these settings to take affect.

* `flow.pathToFlow` (default: 'flow') path to Flow that will be used for VSCode (eg; `"${workspaceFolderBasename}/node_modules/.bin/flow"`). 
* `flow.stopFlowOnExit` (default: true) stop flow server on exit from Project.
* `flow.enabled` (default: true) you can disable flow for some Project for example.
* `flow.useNPMPackagedFlow` (default: false) allows using flow from your node_modules for VSCode. **WARNING**: Setting to true is a security risk. When you open a project we will immediately run code contained within it.
* `flow.showStatus` (default: `true`) If `true` will display a spinner in the status-bar while flow is type checking.
* `flow.showUncovered` (default: `false`) If `true` will show uncovered code by default.
* `flow.runOnEdit` (default: `true`) If `true` will run flow on every edit, otherwise will run only when changes are saved.
* `flow.runOnAllFiles` (default: `false`) Run Flow on all files, No need to put `//@flow comment` on top of files.
* `flow.useLSP` (default: `true`) Turn off to switch from the official Flow Language Server implementation to talking directly to flow.

## Features

* IntelliSense
* Go to Definition / Peek Definition
* Diagnostics (Errors, Warnings)
* Hover type information
* Toggle-able Code Coverage reports

<p align="center">
  <img src="https://github.com/flowtype/flow-for-vscode/raw/master/readme/code-coverage.gif"/>
</p>

## Known Issues

* There are some aspects of Flow syntax which are not supported by the default VS Code JavaScript grammar, if you're having problems with syntax try [JavaScript Atom Grammar](https://marketplace.visualstudio.com/items?itemName=ms-vscode.js-atom-grammar).

## Debugger configuration

First, follow the [instructions](https://code.visualstudio.com/Docs/editor/debugging#_launch-configurations) to setup your launch configuration file, `launch.json`.

To use [flow-remove-types](https://github.com/flowtype/flow-remove-types):

* Follow the [flow-remove-type Quick Start](https://flowtype.org/docs/running.html#flow-remove-types-quick-start).
* In `launch.json`, add `"runtimeArgs": ["-r", "flow-remove-types/register"]` to the "launch" configuration.

To use [Babel](https://babeljs.io):

* Follow the [Babel Quick Start](https://flowtype.org/docs/running.html#babel-quick-start).
* Install [babel-register](http://babeljs.io/docs/core-packages/babel-register/).
* In `.babelrc`, add `"retainLines": true`.
* In `launch.json`, add `"runtimeArgs": ["-r", "babel-register"]` to the "launch" configuration.

## About

This plugin is built on top of [Nuclide](https://github.com/facebook/nuclide)'s Flow support.

## Contributing

* please refer to [CONTRIBUTING.md](CONTRIBUTING.md)

## Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="graphs/contributors"><img src="https://opencollective.com/flow-for-vscode/contributors.svg?width=890&button=false" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/flow-for-vscode#backer)]

<a href="https://opencollective.com/flow-for-vscode#backers" target="_blank"><img src="https://opencollective.com/flow-for-vscode/backers.svg?width=890"></a>


## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/flow-for-vscode#sponsor)]

<a href="https://opencollective.com/flow-for-vscode/sponsor/0/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/1/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/2/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/3/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/4/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/5/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/6/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/7/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/8/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/flow-for-vscode/sponsor/9/website" target="_blank"><img src="https://opencollective.com/flow-for-vscode/sponsor/9/avatar.svg"></a>



## License
[See here](LICENSE)
