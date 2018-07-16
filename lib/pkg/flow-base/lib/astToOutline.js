'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {FlowOutlineTree, Point} from '..';
import {arrayCompact} from '../../commons-node/collection';

import invariant from 'assert';

type Extent = {
  startPosition: Point;
  endPosition: Point;
};

export function astToOutline(ast: any): Array<FlowOutlineTree> {
  return itemsToTrees(ast.body);
}

function itemsToTrees(items: Array<any>): Array<FlowOutlineTree> {
  return arrayCompact(items.map(i => itemToTree(i)));
}

function itemToTree(item: any, kind?: string): ?FlowOutlineTree {
  if (item == null) {
    return null;
  }
  const extent = getExtent(item);
  switch (item.type) {
    case 'VariableDeclaration':
      return {
        representativeName: item.kind,
        nodeType: null,
        children: item.declarations.map(i => itemToTree(i, item.kind)),
        ...extent,
      };
    case 'VariableDeclarator':
      return {
        representativeName: item.id.name,
        nodeType: kind === 'const' ? 'constant' : 'variable',
        children: arrayCompact([itemToTree(item.init)]),
        ...extent,
      };
    case 'FunctionDeclaration':
      return {
        representativeName: item.id.name,
        nodeType: 'function',
        children: arrayCompact([itemToTree(item.body)]),
        ...extent,
      };
    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
      return itemToTree(item.declaration);
    case 'ClassDeclaration':
      return {
        representativeName: item.id.name,
        nodeType: 'class',
        children: itemsToTrees(item.body.body),
        ...extent,
      };
    case 'ClassProperty':
      return {
        representativeName: item.key.name,
        nodeType: 'property',
        children: [],
        ...extent,
      };
    case 'MethodDefinition':
      return {
        representativeName: item.key.name,
        nodeType: item.key.name === 'constructor' ? 'constructor' : 'method',
        children: arrayCompact([itemToTree(item.value)]),
        ...extent,
      };
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return {
        representativeName: 'function',
        nodeType: null,
        children: arrayCompact(item.body.body.map(i => itemToTree(i))),
        ...extent,
      };
    case 'BlockStatement':
      return {
        representativeName: 'block',
        nodeType: null,
        children: arrayCompact(item.body.map(i => itemToTree(i))),
        ...extent,
      };
    case 'ExportDeclaration':
      const tree = itemToTree(item.declaration);
      if (tree == null) {
        return null;
      }
      return {
        representativeName: tree.representativeName,
        nodeType: 'module',
        children: tree.children,
        ...extent,
      };
    case 'ExpressionStatement':
      return topLevelExpressionOutline(item);
    case 'TypeAlias':
    case 'InterfaceDeclaration':
      return {
        representativeName: item.id.name,
        nodeType: 'type',
        children: [],
        ...extent,
      };
    default:
      return null;
  }
}

function getExtent(item: any): Extent {
  return {
    startPosition: {
      // It definitely makes sense that the lines we get are 1-based and the columns are
      // 0-based... convert to 0-based all around.
      line: item.loc.start.line - 1,
      column: item.loc.start.column,
    },
    endPosition: {
      line: item.loc.end.line - 1,
      column: item.loc.end.column,
    },
  };
}

function topLevelExpressionOutline(expressionStatement: any): ?FlowOutlineTree {
  switch (expressionStatement.expression.type) {
    case 'CallExpression':
      return specOutline(expressionStatement, /* describeOnly */ true);
    case 'AssignmentExpression':
      return moduleExportsOutline(expressionStatement.expression);
    default:
      return null;
  }
}

function moduleExportsOutline(assignmentStatement: any): ?FlowOutlineTree {
  invariant(assignmentStatement.type === 'AssignmentExpression');

  const left = assignmentStatement.left;
  if (!isModuleExports(left)) {
    return null;
  }

  const right = assignmentStatement.right;
  if (right.type !== 'ObjectExpression') {
    return null;
  }
  const properties: Array<Object> = right.properties;
  return {
    children: arrayCompact(properties.map(moduleExportsPropertyOutline)),
    representativeName: 'export',
    nodeType: 'module',
    ...getExtent(assignmentStatement),
  };
}

function isModuleExports(left: Object): boolean {
  return left.type === 'MemberExpression' &&
    left.object.type === 'Identifier' &&
    left.object.name === 'module' &&
    left.property.type === 'Identifier' &&
    left.property.name === 'exports';
}

function moduleExportsPropertyOutline(property: any): ?FlowOutlineTree {
  invariant(property.type === 'Property');
  if (property.key.type !== 'Identifier') {
    return null;
  }
  const propName = property.key.name;

  if (property.shorthand) {
    // This happens when the shorthand `{ foo }` is used for `{ foo: foo }`
    return {
      representativeName: propName,
      nodeType: null, // Not needed
      children: [],
      ...getExtent(property),
    };
  }

  if (property.value.type === 'FunctionExpression' ||
    property.value.type === 'ArrowFunctionExpression'
  ) {
    return {
      representativeName: propName,
      nodeType: 'function',
      children: [],
      ...getExtent(property),
    };
  }

  return {
    representativeName: propName,
    nodeType: 'module',
    children: [],
    ...getExtent(property),
  };
}

function specOutline(expressionStatement: any, describeOnly: boolean = false): ?FlowOutlineTree {
  const expression = expressionStatement.expression;
  if (expression.type !== 'CallExpression') {
    return null;
  }
  const functionName = getFunctionName(expression.callee);
  if (functionName == null) {
    return null;
  }
  if (!isDescribe(functionName)) {
    if (describeOnly || !isIt(functionName)) {
      return null;
    }
  }
  const description = getStringLiteralValue(expression.arguments[0]);
  const specBody = getFunctionBody(expression.arguments[1]);
  if (description == null || specBody == null) {
    return null;
  }
  let children;
  if (isIt(functionName)) {
    children = [];
  } else {
    children = arrayCompact(
      specBody
      .filter(item => item.type === 'ExpressionStatement')
      .map(item => specOutline(item)));
  }
  return {
    representativeName: description,
    nodeType: null, // Not needed
    children,
    ...getExtent(expressionStatement),
  };
}

// Return the function name as written as a string. Intended to stringify patterns like `describe`
// and `describe.only` even though `describe.only` is a MemberExpression rather than an Identifier.
function getFunctionName(callee: any): ?string {
  switch (callee.type) {
    case 'Identifier':
      return callee.name;
    case 'MemberExpression':
      if (callee.object.type !== 'Identifier' || callee.property.type !== 'Identifier') {
        return null;
      }
      return `${callee.object.name}.${callee.property.name}`;
    default:
      return null;
  }
}

function isDescribe(functionName: string): boolean {
  switch (functionName) {
    case 'describe':
    case 'fdescribe':
    case 'ddescribe':
    case 'xdescribe':
    case 'describe.only':
      return true;
    default:
      return false;
  }
}

function isIt(functionName: string): boolean {
  switch (functionName) {
    case 'it':
    case 'fit':
    case 'iit':
    case 'pit':
    case 'xit':
    case 'it.only':
      return true;
    default:
      return false;
  }
}

/** If the given AST Node is a string literal, return its literal value. Otherwise return null */
function getStringLiteralValue(literal: ?any): ?string {
  if (literal == null) {
    return null;
  }
  if (literal.type !== 'Literal') {
    return null;
  }
  const value = literal.value;
  if (typeof value !== 'string') {
    return null;
  }
  return value;
}

function getFunctionBody(fn: ?any): ?Array<any> {
  if (fn == null) {
    return null;
  }
  if (fn.type !== 'ArrowFunctionExpression' && fn.type !== 'FunctionExpression') {
    return null;
  }
  return fn.body.body;
}
