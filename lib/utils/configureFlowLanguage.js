/** @flow */

import {languages} from 'vscode'

export function configureFlowLanguage() {
	languages.setLanguageConfiguration('flow', {
		indentationRules: {
			decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
			increaseIndentPattern: /^.*\{[^}"']*$/
		},
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
		comments: {
			lineComment: '//',
			blockComment: ['/*', '*/']
		},
		brackets: [
			['{', '}'],
			['[', ']'],
			['(', ')'],
		],
		__electricCharacterSupport: {
			brackets: [
				{ tokenType:'delimiter.curly.ts', open: '{', close: '}', isElectric: true },
				{ tokenType:'delimiter.square.ts', open: '[', close: ']', isElectric: true },
				{ tokenType:'delimiter.paren.ts', open: '(', close: ')', isElectric: true }
			]
		},
		__characterPairSupport: {
			autoClosingPairs: [
				{ open: '{', close: '}' },
				{ open: '[', close: ']' },
				{ open: '(', close: ')' },
				{ open: '"', close: '"', notIn: ['string'] },
				{ open: '\'', close: '\'', notIn: ['string', 'comment'] }
			]
		}
	});
}