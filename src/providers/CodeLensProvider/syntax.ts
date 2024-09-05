import { logger } from '@/utils/logger';
import path from 'path';
import vscode, { TextDocument } from 'vscode';
import Parser from 'web-tree-sitter';

// more: https://github.com/tree-sitter/tree-sitter.github.io/tree/master
export const SyntaxLoaders = {
  css: 'tree-sitter-css.wasm',
  dart: 'tree-sitter-dart.wasm',
  go: 'tree-sitter-go.wasm',
  html: 'tree-sitter-html.wasm',
  java: 'tree-sitter-java.wasm',
  javascript: 'tree-sitter-javascript.wasm',
  javascriptreact: 'tree-sitter-javascript.wasm',
  json: 'tree-sitter-json.wasm',
  kotlin: 'tree-sitter-kotlin.wasm',
  python: 'tree-sitter-python.wasm',
  rust: 'tree-sitter-rust.wasm',
  scala: 'tree-sitter-scala.wasm',
  swift: 'tree-sitter-swift.wasm',
  typescript: 'tree-sitter-typescript.wasm',
  typescriptreact: 'tree-sitter-tsx.wasm',
  cpp: 'tree-sitter-cpp.wasm',
  php: 'tree-sitter-php.wasm',
  ruby: 'tree-sitter-ruby.wasm',
  vue: 'tree-sitter-vue.wasm',
};

export type SupportsLanguages = keyof typeof SyntaxLoaders;

export const isSupportDocument = (document: TextDocument): boolean => {
  const languageId = document.languageId;
  return document.lineCount <= 5000 && languageId in SyntaxLoaders;
};

export class SyntaxService {
  cacheParsers: Map<SupportsLanguages, Parser>;

  constructor() {
    this.cacheParsers = new Map<SupportsLanguages, Parser>();
  }

  async getParser(lang: SupportsLanguages) {
    logger.debug('getParser', lang);
    if (this.cacheParsers.has(lang)) {
      return this.cacheParsers.get(lang)!;
    }
    const parser = await this.initParser(lang);
    this.cacheParsers.set(lang, parser);
    return parser;
  }

  async initParser(lang: SupportsLanguages) {
    await Parser.init();
    const parser = new Parser();
    const wasmPath = path.resolve(__dirname, `resources/wasm/${SyntaxLoaders[lang]}`);
    const Lang = await Parser.Language.load(wasmPath);
    parser.setLanguage(Lang);
    return parser;
  }

  async parse(document: TextDocument) {
    if (isSupportDocument(document)) {
      const parser = await this.getParser(document.languageId as SupportsLanguages);
      const tree = parser.parse(document.getText());
      return tree;
    }
    return null;
  }
}

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
