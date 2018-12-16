/**
 * Adds a gloabl that is used inside consoleAppender.js to output console messages
 * to the user, instead of to the developer console.
 */
export function setupLogging(context): void {
  const channel = vscode.window.createOutputChannel("Flow");
  vscode.commands.registerCommand("flow.show-output", () => channel.show());
  global.flowOutputChannel = channel;
  context.subscriptions.push(channel);
}
