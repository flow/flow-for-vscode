/* @flow */
import * as lsp from 'vscode-languageclient';

// NOTE: by default vscode logs & opens output panel for lsp command errors which is very annoying for common errors.
// This function will ignore some common flow lsp errors which are not that important to user.

// @HACK: couldnt find any clean way to implement this
export default function ignoreFlowFrequentErrors(client: lsp.LanguageClient) {
  const origLogFailedRequest = client.logFailedRequest;
  // $FlowDisableNextLine: hack to wrap failedRequest
  client.logFailedRequest = (type: lsp.RPCMessageType, error: any) => {
    if (notEnoughTypeInformationError(type, error)) {
      return;
    }
    origLogFailedRequest.call(client, type, error);
  };
}

function notEnoughTypeInformationError(type: lsp.RPCMessageType, error: mixed) {
  return (
    type.method === 'textDocument/completion' &&
    error &&
    typeof error.message === 'string' &&
    error.message.includes('not enough type information to autocomplete')
  );
}
