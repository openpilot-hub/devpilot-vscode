import Parser from 'web-tree-sitter';
import path, { basename, extname } from 'path';
import vscode from 'vscode';
import fs from 'fs';
import SyntaxService, { SupportsLanguages } from './syntax';
import { getLanguageForMarkdown } from '@/utils/mapping';
import { getWorkspaceRoot } from '@/utils/vscode-extend';
import { removeComments } from '@/utils';
import { CodeReference } from '@/typing';

const Types = ['class_declaration', 'function_declaration', 'enum_declaration', 'type_alias_declaration', 'interface_declaration'];
const VarTypes = ['lexical_declaration', 'variable_declaration'];
const ModuleTypes = ['import_statement', 'export_statement'];

export const Ext2LangMapper: { [key: string]: string } = {
  ts: 'typescript',
  tsx: 'typescriptreact',
  js: 'javascript',
  jsx: 'javascriptreact',
};

const ValidExts = Object.keys(Ext2LangMapper)
  .map((item) => `.${item}`)
  .concat('.d.ts');

const ValidIndexFiles = ValidExts.map((item) => [`index${item}`, `Index${item}`]).flat();

interface ICompilerOptions {
  baseUrl: string;
  paths: { [key: string]: string[] };
}

interface IDefinitionItem {
  identifier: string;
  souceCode: string;
  range: vscode.Range;
  fsPath: string;
  fileName: string;
  languageId: string;
  package?: string;
}

interface IImportItem {
  type: 'namespace' | 'named' | 'default';
  identifier: string;
  aliasIdentifier?: string;
  souceCode: string;
  range: vscode.Range;
  package: string;
}

function readTsconfig(configPath: string) {
  try {
    let rawConfig = fs.readFileSync(configPath, 'utf-8');
    if (rawConfig) {
      rawConfig = removeComments(rawConfig);
      const config: {
        compilerOptions?: ICompilerOptions;
      } = JSON.parse(rawConfig);
      return config?.compilerOptions;
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * e.g: import('/service') =>  import('/service/index.ts')
 * @param path
 */
function resolvePhysicalImportPath(abstractPath: string) {
  if (extname(abstractPath)) {
    return abstractPath;
  }
  let temmPath: string;
  for (const ext of ValidExts) {
    temmPath = abstractPath + ext;
    if (fs.existsSync(temmPath)) {
      return temmPath;
    }
  }
  for (const index of ValidIndexFiles) {
    temmPath = path.join(abstractPath, index);
    if (fs.existsSync(temmPath)) {
      return temmPath;
    }
  }
}

function resolveAliasImportPath(importPath: string, compilerOptions: ICompilerOptions) {
  const { baseUrl, paths } = compilerOptions;
  for (const [key, value] of Object.entries(paths)) {
    const regexKey = key.replace('*', '(.*)');
    const match = importPath.match(new RegExp(`^${regexKey}$`));
    if (match) {
      const wildcard = match[1];
      const resolvedPath = value[0].replace('*', wildcard);
      const abstractPath = path.resolve(baseUrl, resolvedPath);
      return resolvePhysicalImportPath(abstractPath);
    }
  }
}

function getComments(node: Parser.SyntaxNode) {
  const results: Parser.SyntaxNode[] = [];
  while (node.previousSibling?.type === 'comment') {
    results.unshift(node.previousSibling);
    node = node.previousSibling;
  }
  return results;
}

function getIdentifiers(node: Parser.SyntaxNode) {
  const results: string[] = [];
  const looper = (nodes: Parser.SyntaxNode[]) => {
    for (const child of nodes) {
      if ('identifier' === child.type) {
        results.push(child.text);
      } else if (child.children.length) {
        looper(child.children);
      }
    }
  };
  looper(node.children);
  return results;
}

function findDefinitionUpwards(rootNode: Parser.SyntaxNode, identifierNames: string[], cursorPosition: Parser.Point) {
  // 当前光标或者当前函数所在node
  let currrentNode: Parser.SyntaxNode | null = rootNode.descendantForPosition(cursorPosition);
  let parentNode: Parser.SyntaxNode | null = currrentNode;

  // 如果是一个函数体：可直接取parent
  // 如果是补全：则肯定是取外部的元素

  if (!['program', 'statement_block'].includes(parentNode.type)) {
    parentNode = parentNode.parent;
  }

  if (!parentNode) return null;

  const foundIdentifierNames: string[] = [];
  const results: IDefinitionItem[] = [];

  while (parentNode?.children.length) {
    for (const node of parentNode.children) {
      if (node.id !== currrentNode.id) {
        let name: string | undefined;
        if ('export_statement' === node.type) {
          // TODO: 默认导出对象，有类型引用怎么办？
          name = node.childForFieldName('declaration')?.childForFieldName('name')?.text;
        } else if (VarTypes.includes(node.type)) {
          const declarator = node.children.find((item) => item.type === 'variable_declarator');
          const nameNode = declarator?.childForFieldName('name');
          if (nameNode?.type === 'identifier') {
            // const a = 1;
            name = nameNode?.text;
          } else if (declarator) {
            // const [loading, setLoading] = useState(false); // name: array_pattern
            // const { oProp: propV2 } = window.xxxxx; // name: object_pattern
            // two symbols in the same line, but only need one.
            // console.log('----declarator', declarator.text);
            const identifiers = getIdentifiers(declarator).filter((item) => identifierNames.includes(item));
            // console.log('----declarator.identifiers', identifiers);
            if (identifiers.length) {
              name = identifiers[0];
              foundIdentifierNames.push(...identifiers);
            }
          }
        } else if (Types.includes(node.type)) {
          name = node.childForFieldName('name')?.text;
        }
        if (name && identifierNames.includes(name)) {
          if (!foundIdentifierNames.includes(name)) {
            foundIdentifierNames.push(name);
          }
          const nodes = [...getComments(node), node];
          results.push({
            range: new vscode.Range(
              nodes[0].startPosition.row,
              nodes[0].startPosition.column,
              node.endPosition.row,
              node.endPosition.column
            ),
            identifier: name,
            souceCode: nodes.map((item) => item.text).join('\n'),
            fsPath: '',
            languageId: '',
            fileName: '',
          });
          if (foundIdentifierNames.length >= identifierNames.length) {
            return { results, foundIdentifierNames };
          }
        }
      }
    }
    parentNode = parentNode.parent;
  }
  // done partially or not found.
  return { results, foundIdentifierNames };
}

function findExportDefinition(rootNode: Parser.SyntaxNode, importInfo: IImportItem) {
  const getDefinition = (node: Parser.SyntaxNode): IDefinitionItem => {
    return {
      range: new vscode.Range(node.startPosition.row, node.startPosition.column, node.endPosition.row, node.endPosition.column),
      identifier: importInfo.identifier,
      souceCode: node.text,
      fsPath: '',
      languageId: '',
      fileName: '',
    };
  };
  if (importInfo.type === 'default') {
    const node = rootNode.children.find((item) => item.type === 'export_statement' && item.children[1]?.text === 'default');
    if (node) {
      return getDefinition(node);
    }
  } else if (importInfo.type === 'namespace') {
    return getDefinition(rootNode);
  } else {
    for (const node of rootNode.children) {
      if (node.type === 'export_statement') {
        const declarationNode = node.childForFieldName('declaration');
        let name = declarationNode?.childForFieldName('name')?.text;
        if (!name) {
          name = declarationNode?.children.find((item) => ['variable_declarator'].includes(item.type))?.childForFieldName('name')?.text;
        }
        if (name && importInfo.identifier === name) {
          return getDefinition(node);
        }
      }
    }
  }
}

export function findImportNodes(rootNode: Parser.SyntaxNode, identifierNames: string[]) {
  const importNodes = rootNode.children.filter((item) => item.type === 'import_statement');
  const results: IImportItem[] = [];

  for (const node of importNodes) {
    const import_clause = node.children.find((item) => item.type === 'import_clause');
    if (!import_clause) continue;
    const importNode = import_clause.children[0];
    const packageName = node.childForFieldName('source')?.text?.replaceAll("'", '')!;
    const range = new vscode.Range(node.startPosition.row, node.startPosition.column, node.endPosition.row, node.endPosition.column);

    if (importNode.type === 'namespace_import') {
      // e.g. import * as vscode from 'vscode';
      const identifier = importNode.children.find((item) => item.type === 'identifier')?.text;
      if (identifier && identifierNames.includes(identifier)) {
        results.push({
          type: 'namespace',
          identifier,
          package: packageName,
          range,
          souceCode: node.text,
        });
      }
    } else {
      let found = false;
      // e.g. import React from 'react'
      if (importNode.type === 'identifier') {
        const identifier = importNode.text;
        if (identifier && identifierNames.includes(identifier)) {
          found = true;
          results.push({
            type: 'default',
            identifier,
            package: packageName,
            range,
            souceCode: node.text,
          });
        }
      }
      if (!found) {
        // e.g. import { useState, useEffect as useEffect2 } from 'react';
        const import_specifiers = import_clause.children
          .find((item) => item.type === 'named_imports')
          ?.children.filter((item) => item.type === 'import_specifier');
        if (import_specifiers?.length) {
          for (const specifier of import_specifiers) {
            const identifier = specifier.childForFieldName('alias')?.text || specifier.childForFieldName('name')!.text;
            if (identifier && identifierNames.includes(identifier)) {
              results.push({
                type: 'named',
                identifier: specifier.childForFieldName('name')!.text,
                aliasIdentifier: specifier.childForFieldName('alias')?.text,
                package: packageName,
                range,
                souceCode: node.text,
              });
            }
          }
        }
      }
    }

    if (results.length >= identifierNames.length) {
      break;
    }
  }

  const allImports = results.filter((item) => item.package);
  const uniqueImports: IImportItem[] = [];

  allImports.forEach((item) => {
    if (!uniqueImports.find((i) => i.package === item.package)) {
      uniqueImports.push(item);
    }
  });

  return [uniqueImports, allImports];
}

export function findDefinitionNodes2(rootNode: Parser.SyntaxNode, identifierNames: string[], cursorPosition: Parser.Point) {
  // 当前光标或者当前函数所在node
  let currrentNode: Parser.SyntaxNode | null = rootNode.descendantForPosition(cursorPosition);
  let parentNode: Parser.SyntaxNode | null = currrentNode;

  // 如果是一个函数体：可直接取parent
  // 如果是补全：则肯定是取外部的元素

  if (parentNode && !['program', 'statement_block'].includes(parentNode.type)) {
    parentNode = parentNode.parent;
  }

  if (!parentNode) return null;

  const results: Parser.SyntaxNode[] = [];
  const types = [...Types, ...VarTypes];

  const getParent = (node: Parser.SyntaxNode | null) => {
    while (node) {
      if (types.includes(node.type)) {
        if (node.parent) {
          if (ModuleTypes.includes(node.parent.type)) {
            // return export/import node
            return node.parent;
          }
        }
        // return declaration node
        return node;
      }
      node = node.parent;
    }
  };

  let foundCount = 0;
  while (parentNode?.children.length) {
    for (const node of parentNode.children) {
      if (node.id !== currrentNode.id) {
        if (node.type === 'identifier' && identifierNames.includes(node.text)) {
          // 直接走查到identifier形式，然后向上回溯，找到lexical_declaration等节点
          const parent = getParent(node);
          if (parent && !results.find((item) => item.id === parent.id)) {
            results.push(parent);
          }
          if (++foundCount >= identifierNames.length) {
            // done
            return results;
          }
        }
      }
    }
    parentNode = parentNode.parent;
  }
  // done partially or not found.
  return results;
}

function getLangId(fsPath: string) {
  const extName = fsPath.split('.').pop()!;
  return Ext2LangMapper[extName];
}

function isLocalImport(source: string) {
  return source.startsWith('.');
}

/**
 * @param imports
 * @param fsPath the fs path of the current file
 * @returns
 */
async function resolveSymbolsDefinitionFromImports(imports: IImportItem[], fsPath: string) {
  const currentFileDir = path.dirname(fsPath);
  const workspaceRoot = getWorkspaceRoot(fsPath);
  const importsFullInfos: (IImportItem & { fsPath: string })[] = [];

  // find tsconfig.json
  let configPath: string | undefined;
  if (workspaceRoot) {
    const tsconfigPath = path.resolve(workspaceRoot, 'tsconfig.json');
    const jsconfigPath = path.resolve(workspaceRoot, 'jsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      configPath = tsconfigPath;
    } else if (fs.existsSync(jsconfigPath)) {
      configPath = jsconfigPath;
    }

    if (configPath) {
      const compilerOptions = readTsconfig(configPath);
      const baseUrl = path.resolve(workspaceRoot, compilerOptions?.baseUrl || '.');
      // check if has path alias
      if (compilerOptions?.paths && Object.keys(compilerOptions.paths).length) {
        // resolve alias import.
        imports
          .filter((item) => !isLocalImport(item.package))
          .forEach((item) => {
            const importFilePath = resolveAliasImportPath(item.package, { baseUrl, paths: compilerOptions.paths });
            if (importFilePath) {
              importsFullInfos.push({ ...item, fsPath: importFilePath });
            }
          });
      }
    }
  }
  // resolve local imnport
  imports.forEach((item) => {
    if (isLocalImport(item.package)) {
      const abstractPath = path.resolve(currentFileDir, item.package);
      const fsPath = resolvePhysicalImportPath(abstractPath);
      if (fsPath) {
        importsFullInfos.push({ ...item, fsPath });
      }
    }
  });

  const docMap = new Map<string, Parser.Tree | null>();
  const results: IDefinitionItem[] = [];

  for (const importInfo of importsFullInfos) {
    if (importInfo.fsPath && fs.existsSync(importInfo.fsPath)) {
      const targetLangId = getLangId(importInfo.fsPath);
      if (targetLangId) {
        try {
          let targetAstTree: Parser.Tree | null | undefined = docMap.get(importInfo.fsPath);
          if (!docMap.has(importInfo.fsPath)) {
            const targetDocText = fs.readFileSync(importInfo.fsPath, 'utf8');
            targetAstTree = await SyntaxService.instance.parse(targetDocText, targetLangId);
            docMap.set(importInfo.fsPath, targetAstTree);
          }
          if (targetAstTree) {
            const definition = findExportDefinition(targetAstTree.rootNode, importInfo);
            if (definition) {
              if (definition.souceCode.split(/[\r\n]+/).length < 200) {
                results.push({
                  ...definition,
                  fsPath: importInfo.fsPath,
                  languageId: targetLangId,
                  fileName: basename(importInfo.fsPath),
                  package: importInfo.package,
                });
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  }

  return results;
}

export async function resolveSymbolsDefinition(options: {
  symbols: string[];
  currentFilefsPath: string;
  docText: string;
  startPosition: Parser.Point;
  abortController: AbortController;
}) {
  const { symbols, docText, currentFilefsPath, startPosition, abortController } = options;
  const langId = getLangId(currentFilefsPath);
  if (!langId) return;

  let aborted = false;
  abortController.signal.addEventListener('abort', () => {
    aborted = true;
  });

  try {
    const astTree = await SyntaxService.instance.parse(docText, langId);
    if (astTree && !aborted) {
      const res = findDefinitionUpwards(astTree.rootNode, symbols, startPosition);
      if (res) {
        const { results, foundIdentifierNames } = res;
        const unfoundSymbols = symbols.filter((item) => !foundIdentifierNames.includes(item));
        const [imports, allImports] = findImportNodes(astTree.rootNode, unfoundSymbols);
        if (imports.length) {
          results.unshift(...imports2Definitions(imports));
          const externalDefinitions = await resolveSymbolsDefinitionFromImports(allImports, currentFilefsPath);
          results.unshift(...externalDefinitions);
        }
        const fileName = basename(currentFilefsPath);
        results.forEach((item) => {
          // resolveSymbolsDefinitionFromImports has already give those info.
          if (!item.fsPath) {
            item.fsPath = currentFilefsPath;
            item.fileName = fileName;
            item.languageId = langId;
          }
        });
        return results;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export function definitions2CodeReferences(definitions: IDefinitionItem[]): CodeReference[] {
  return definitions.map((item) => {
    const languageId = getLanguageForMarkdown(item.languageId);
    return {
      languageId,
      fileUrl: item.fsPath,
      fileName: item.fileName,
      packageName: item.package,
      sourceCode: item.souceCode, // DO NOT wrap in code block.
      selectedStartLine: item.range.start.line,
      selectedStartColumn: item.range.start.character,
      selectedEndLine: item.range.end.line,
      selectedEndColumn: item.range.end.character,
      visible: true,
    };
  });
}

export function imports2Definitions(imports: IImportItem[]) {
  return imports.map((item) => {
    return {
      identifier: item.identifier,
      souceCode: item.souceCode,
      range: item.range,
      fsPath: '',
      fileName: '',
      languageId: '',
    };
  });
}
