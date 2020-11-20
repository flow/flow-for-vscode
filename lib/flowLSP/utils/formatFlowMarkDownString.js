/* @flow */
import * as vscode from 'vscode';
import format from '../../common/format';

export default function formatFlowMarkDownString(
  mdStr: vscode.MarkdownString,
): vscode.MarkdownString {
  const code = extractCode(mdStr, 'flow');
  const formatted = format(code);
  const formattedStr = new vscode.MarkdownString();
  formattedStr.appendCodeblock(formatted, 'javascript');
  return formattedStr;
}

// ```languageID code``` => code
function extractCode(mdStr: vscode.MarkdownString, language: string): string {
  return mdStr.value
    .replace(`\`\`\`${language}`, '')
    .replace('```', '')
    .trim();
}
