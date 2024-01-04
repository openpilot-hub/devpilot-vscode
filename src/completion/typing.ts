export enum DevPilotFunctionality {
  ExplainCode = 'explainCode',
  FixBug = 'fixBug',
  GenerateComment = 'generateComment',
  GenerateTest = 'generateTest',
  CheckPerformance = 'checkPerformance',
  CodeReview = 'codeReview'
}

export type ProviderType = 'openai' | 'azure' | 'za';

export enum Locale {
  Chinese = 'Chinese',
  English = 'English'
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
  Other = 'other'
}

export interface Message {
  content: string
  role: 'user' | 'assistant' | 'system'
  username: string
  avatar: string
  time: string
}

export interface LLMProvider {
  name: string;
  chat: (messages: Message[], onText?: (text: string)=> void) => Promise<string>;
}

export interface LLMProviderOption {
  apiEndpoint?: string;
  apiKey?: string;
  proxy?: string;
  model?: string;
  stream?: boolean;
}
