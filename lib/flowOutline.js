'use babel';
// @flow

import * as vscode from 'vscode';

import type {Location, DocumentSymbolProvider} from 'vscode';

import {flowGetOutline, type FlowOutlineTree, type FlowNodeType} from './pkg/flow-base/lib/FlowService';

export class SymbolProvider implements DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[]> {
		const fileName = document.uri.fsPath;
		const currentContents = document.getText();
		const outline = await flowGetOutline(currentContents);
		if (outline == null) {
			return [];
		}
		const outlineItems = [];
		outline.forEach((flowNode: FlowOutlineTree) => {
			outlineItems.push(...mapFlowNodeToSymbolInformation(flowNode));
		})
		return outlineItems;
	}
}

function mapFlowNodeToSymbolInformation(flowNode: FlowOutlineTree, parent?: string): Array<vscode.SymbolInformation> {
	const kind = inferSymbolKindFromTokenList(flowNode.nodeType);
	const name = flowNode.representativeName || 'unknown';
	const range = new vscode.Range(
		new vscode.Position(flowNode.startPosition.line, flowNode.startPosition.column),
		new vscode.Position(flowNode.endPosition.line, flowNode.endPosition.column)
	);
	const symbols = [];
	if (flowNode.nodeType != null) {
		symbols.push(new vscode.SymbolInformation(
			name,
			kind,
			range,
			undefined,
			parent
		));
	}

	flowNode.children
		.map(c => mapFlowNodeToSymbolInformation(c, name))
		.forEach(childSymbols => symbols.push(...childSymbols));
	return symbols;
}

function inferSymbolKindFromTokenList(nodeType: FlowNodeType): vscode.SymbolKindType {
	switch (nodeType) {
		case 'type': return vscode.SymbolKind.Interface;
		case 'class': return vscode.SymbolKind.Class;
		case 'method': return vscode.SymbolKind.Method;
		case 'function': return vscode.SymbolKind.Function;
		case 'property': return vscode.SymbolKind.Property;
		case 'variable': return vscode.SymbolKind.Variable;
		
		// This is the way it's represented in Typescript outline, so we'll do the same
		case 'constructor': return vscode.SymbolKind.Variable; // .Constructor
		case 'constant': return vscode.SymbolKind.Variable; // .Constant
	}
	return vscode.SymbolKind.Variable;
}
