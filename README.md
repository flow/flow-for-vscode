# Flow for Visual Studio Code

This extension adds [Flow](http://flowtype.org) support for VS Code. Flow is a static type checker, designed to find type errors in JavaScript programs.

<p align="center">
  <img src="https://github.com/flowtype/flow-for-vscode/raw/master/readme/flow-main.gif"/>
</p>

Want to help make Flow in VS Code really shine? We're looking for help on moving to the new [flow-language-server support in flow](https://github.com/flowtype/flow-language-server). This means the flow core team would add features, and this extension will get them for _almost free_. If this is you, you can get [set up for development](https://github.com/flowtype/flow-for-vscode/blob/master/CONTRIBUTING.md) easily.

## Installation

Search for "flow" in the VS Code extensions panel.

## Setup

* Flow is [supported](https://github.com/facebook/flow#requirements) on Mac, 64-bit Windows, and Linux, follow [flowtype.org](http://flowtype.org/docs/getting-started.html#_) to get started
* You need a `.flowconfig` in your workspace to enable the flow features
* Make sure you are able to run the `flow` command from the command line ( or you have `flow.useNPMPackagedFlow` option as `true` )
* You will want to disable the TypeScript built-in extension for your project 

<p align="center">
  <img src="https://github.com/flowtype/flow-for-vscode/raw/master/readme/flow-disable-tsc.gif"/>
</p>

## Configuration
You can specify a configuration by amending the VS Code `settings.json` file. Access this through Preferences -> Settings. You must reload VS Code after installing this extension for these settings to take affect.

* `flow.pathToFlow` (default: 'flow') path to Flow that will be used for VSCode (eg; `"${workspaceRoot}/node_modules/.bin/flow"`). 
* `flow.stopFlowOnExit` (default: true) stop flow server on exit from Project.
* `flow.enabled` (default: true) you can disable flow for some Project for example.
* `flow.useNPMPackagedFlow` (default: false) you can also run Flow by defining it in your `package.json`.
* `flow.showStatus` (default: `true`) If `true` will display a spinner in the status-bar while flow is type checking.
* `flow.runOnEdit` (default: `true`) If `true` will run flow on every edit, otherwise will run only when changes are saved.
* `flow.runOnAllFiles` (default: `false`) Run Flow on all files, No need to put `//@flow comment` on top of files.

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

## License
[See here](LICENSE)
