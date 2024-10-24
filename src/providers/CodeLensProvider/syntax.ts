import vscode from 'vscode';
import Parser from 'web-tree-sitter';

function findRangesByType(node: Parser.SyntaxNode, nodeTypes: string[], methods: vscode.Range[]): vscode.Range[] {
  if (nodeTypes.includes(node.type)) {
    const startPos = new vscode.Position(node.startPosition.row, node.startPosition.column);
    const endPos = new vscode.Position(node.endPosition.row, node.endPosition.column);
    const range = new vscode.Range(startPos, endPos);
    // ignore arrow functions that act as a parameter or has just single line.
    if (!(node.type === 'arrow_function' && (startPos.line === endPos.line || ['{', '('].includes(node.previousSibling?.text as string)))) {
      methods.push(range);
    }
  }
  for (const child of node.children) {
    findRangesByType(child, nodeTypes, methods);
  }
  return methods;
}

export function getAllFunctionsRange(ast: Parser.Tree): vscode.Range[] {
  return findRangesByType(
    ast.rootNode,
    ['function_definition', 'function_declaration', 'method_definition', 'method_declaration', 'arrow_function', 'function_expression'],
    []
  );
}
