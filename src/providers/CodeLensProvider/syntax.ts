import { logger } from '@/utils/logger';
import path from 'path';
import vscode, { TextDocument } from 'vscode';
import Parser from 'web-tree-sitter';

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

function findNodesByType(node: Parser.SyntaxNode, nodeType: string, methods: vscode.Range[] = []): vscode.Range[] {
  if (node.type === nodeType) {
    const startPos = new vscode.Position(node.startPosition.row, node.startPosition.column);
    const endPos = new vscode.Position(node.endPosition.row, node.endPosition.column);
    const range = new vscode.Range(startPos, endPos);
    methods.push(range);
  }
  for (const child of node.children) {
    findNodesByType(child, nodeType, methods);
  }
  return methods;
}

export function getAllFunctionsRange(ast: Parser.Tree): vscode.Range[] {
  return findNodesByType(ast.rootNode, 'function_declaration', []);
}

export function getAllMethodsRange(ast: Parser.Tree): vscode.Range[] {
  return findNodesByType(ast.rootNode, 'method_declaration', []);
}
