/* @flow */
// Middleware:
// 1) Prevent duplicate results in nested .flowconfig directory structure
// - root
//   -.flowconfig [lsp running for all files under root (including project-a files) [client-root]]
//   - fileA.js
//   - project-a
//     -.flowconfig [lsp running for all files under project-a [client-A]]
//     - fileB.js  [client-root and client-A both serve lsp request for this file]
// Below middleware will noop fileB.js request in client-root

import * as vscode from 'vscode';
import * as lsp from '../utils/LanguageClient';
import FlowconfigCache from '../utils/FlowconfigCache';
import formatMarkedDownString from '../utils/formatMarkedDownString';
import semver from 'semver';

export default function createMiddleware(
  clientFlowconfig: string,
  flowVersion: string,
): lsp.Middleware {
  const flowconfigCache = new FlowconfigCache('.flowconfig');
  const shouldFixFlowCompletionItemRangeBug = semver.satisfies(
    flowVersion,
    // @TODO: put upper limit when https://github.com/facebook/flow/commit/909e50ec released
    '>=0.97.0',
  );

  return {
    didOpen(document, next) {
      // NOTE: language client already matches document with passed documentSelector (js files)
      // so document here is always js file
      flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document);
        }
        return undefined;
      });
    },

    didClose(document, next) {
      flowconfigCache.get(document).then(docFlowconfig => {
        // delete from cache after file closes
        // will keep a upper limit on cache size
        flowconfigCache.delete(document);

        if (docFlowconfig === clientFlowconfig) {
          return next(document);
        }
        return undefined;
      });
    },

    didChange(event, next) {
      flowconfigCache.get(event.document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(event);
        }
        return undefined;
      });
    },

    provideCompletionItem(document, position, context, token, next) {
      return flowconfigCache
        .get(document)
        .then(docFlowconfig => {
          if (docFlowconfig === clientFlowconfig) {
            return next(document, position, context, token);
          }
          return null;
        })
        .then(result => {
          if (result && shouldFixFlowCompletionItemRangeBug) {
            // @FIX: for https://github.com/flowtype/flow-for-vscode/issues/335 & https://github.com/facebook/flow/issues/7659
            // Issue: Range returned by flow is not correct (flow >= 0.97)
            // Fix: vscode uses defaultRange if range missing in item which will work for our use cases
            // so deleting item.range returned by flow
            const items = Array.isArray(result) ? result : result.items;
            items.forEach(item => {
              delete item.range;
            });
          }

          return result;
        });
    },

    // Not needed
    // resolveCompletitionItem

    provideHover(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return Promise.resolve(next(document, position, token)).then(
            formatHoverContent,
          );
        }
        return null;
      });
    },

    // Adding this middleware for future
    // current flow (<=0.89) doesnt support signatureHelp.
    provideSignatureHelp(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }
        return null;
      });
    },

    provideDefinition(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }
        return null;
      });
    },

    provideReferences(document, position, options, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, options, token);
        }
        return null;
      });
    },

    provideDocumentHighlights(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }
        return null;
      });
    },

    provideDocumentSymbols(document, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, token);
        }
        return null;
      });
    },

    provideRenameEdits(document, position, newName, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, newName, token);
        }
        return null;
      });
    },

    // Adding this middleware for future
    // current flow (<=0.89) doesnt support this.
    prepareRename(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }
        return null;
      });
    },

    provideTypeCoverage(document, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document);
        }
        return null;
      });
    },

    // @TODO: will add later when flow supports this
    // provideWorkspaceSymbols
    // provideCodeActions
    // provideCodeLenses
    // resolveCodeLens
    // provideDocumentFormattingEdits
    // provideDocumentRangeFormattingEdits
    // provideOnTypeFormattingEdits
    // provideDocumentLinks
    // provideDocumentLink
    // workspace
  };
}

function formatHoverContent(value: ?vscode.Hover): ?vscode.Hover {
  if (!value) {
    return value;
  }

  // format content
  value.contents = value.contents.map(content => {
    // NOTE: in our case, content is always MarkdownString
    if (content instanceof vscode.MarkdownString) {
      return formatMarkedDownString(content);
    }
    return content;
  });

  return value;
}
