export enum DevPilotFunctionality {
  Welcome = 'welcome',
  ExplainCode = 'explainCode',
  FixBug = 'fixBug',
  GenerateComment = 'generateComment',
  GenerateTest = 'generateTest',
  CheckPerformance = 'checkPerformance',
  CodeReview = 'codeReview',
  CommentCode = 'commentCode',
  SummaryCode = 'summaryCode',
}

export type ProviderType = 'OpenAI' | 'Azure' | 'ZA';

export enum Locale {
  Chinese = 'cn',
  English = 'en',
}

export enum Language {
  Java = 'java',
  Python = 'python',
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  C = 'c',
  Cpp = 'cpp',
  CSharp = 'cs',
  Go = 'go',
  Ruby = 'ruby',
  PHP = 'php',
  Swift = 'swift',
  Kotlin = 'kotlin',
  Scala = 'scala',
  Rust = 'rust',
  Haskell = 'haskell',
  Dart = 'dart',
  Lua = 'lua',
  SQL = 'sql',
  HTML = 'html',
  CSS = 'css',
  JSX = 'jsx',
  TSX = 'tsx',
  JSON = 'json',
  YAML = 'yaml',
  Markdown = 'markdown',
  Bash = 'bash',
  Shell = 'sh',
  Other = 'other',
}

export enum QuickCommand {
  Fix = '/fix',
  Clear = '/clear',
}

export interface CodeReference {
  fileUrl: string;
  fileName: string;
  sourceCode: string;
  selectedStartLine: number;
  selectedEndLine: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  prompt?: string;
  status: 'ok' | 'error';
  role: 'user' | 'assistant' | 'system' | 'divider' | 'error';
  username: string;
  avatar: string;
  time: number;
  streaming: boolean;
  codeRef?: CodeReference;
}

export interface LLMChatHandler {
  onText: (callback: (text: string, options: { id: string }) => void) => void;
  onInterrupted: (callback: () => void) => void;
  result: () => Promise<string>;
  interrupt: () => void;
}

export interface LLMProvider {
  name: string;
  chat: (messages: ChatMessage[], extraOptions?: { repo: string }) => Promise<LLMChatHandler>;
}

export interface LLMProviderOption {
  apiEndpoint?: string;
  apiKey?: string;
  proxy?: string;
  model?: string;
  stream?: boolean;
  username: () => string;
  usertoken: () => string;
  pluginVersion: () => string;
  authType: () => string;
}
