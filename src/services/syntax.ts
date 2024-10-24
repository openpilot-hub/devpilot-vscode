import { logger } from '@/utils/logger';
import path from 'path';
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

export const isSupportDocument = (languageId: string): languageId is SupportsLanguages => {
  return languageId in SyntaxLoaders;
};

export default class SyntaxService {
  static instance: SyntaxService = new SyntaxService();

  private cacheParsers: Map<SupportsLanguages, Parser>;

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

  async parse(documentText: string, languageId: string) {
    if (isSupportDocument(languageId)) {
      const parser = await this.getParser(languageId);
      const tree = parser.parse(documentText);
      return tree;
    }
    return null;
  }
}
