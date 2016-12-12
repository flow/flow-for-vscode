### Master

* When you want to work on the flow-for-vscode project, pressing run will start the
  babel build watcher task - orta

### 4.0

* Adds the ability to use flow from your project's node_modules folder. 
  This is a security risk ( see https://github.com/facebook/nuclide/issues/570) and so it
  is hidden behind a user setting of `useNPMPackagedFlow` which needs to be set to `true`
  for it to work. - orta #53
* Show flow errors that start at line 0 - orta #54 
