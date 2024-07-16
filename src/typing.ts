export enum DevPilotFunctionality {
  /**
   * PluginCommand.ExplainCode
   */
  ExplainCode = 'EXPLAIN_CODE',
  /**
   * PluginCommand.FixCode
   */
  FixCode = 'FIX_CODE',
  /**
   * inline comments. PluginCommand.CommentCode
   */
  CommentCode = 'GENERATE_COMMENTS',
  /**
   * PluginCommand.TestCode
   */
  GenerateTest = 'GENERATE_TESTS',
  /**
   * PluginCommand.CheckCodePerformance
   */
  CheckPerformance = 'CHECK_PERFORMANCE',
  ReviewCode = 'REVIEW_CODE',
  /**
   * summary comment for method
   */
  CommentMethod = 'COMMENT_METHOD',
  GenerateCommit = 'GENERATE_COMMIT',
}

export enum PluginCommand {
  LocaleChanged = 'LocaleChanged',
  ThemeChanged = 'ThemeChanged',
  ConfigurationChanged = 'ConfigurationChanged',
  RenderChatConversation = 'RenderChatConversation',
  LikeMessage = 'LikeMessage',
  DislikeMessage = 'DislikeMessage',
  DeleteMessage = 'DeleteMessage',
  RegenerateMessage = 'RegenerateMessage',
  AppendToConversation = 'AppendToConversation',
  InterruptChatStream = 'InterruptChatStream',
  GotoSelectedCode = 'GotoSelectedCode',
  InsertCodeAtCaret = 'InsertCodeAtCaret',
  ReplaceSelectedCode = 'ReplaceSelectedCode',
  CreateNewFile = 'CreateNewFile',
  ClearChatHistory = 'ClearChatHistory',
  FixCode = 'FixCode',
  ExplainCode = 'ExplainCode',
  CommentCode = 'CommentCode',
  TestCode = 'TestCode',
  CopyCode = 'CopyCode',
  OpenFile = 'OpenFile',
  CheckCodePerformance = 'CheckCodePerformance',
  PresentCodeEmbeddedState = 'PresentCodeEmbeddedState',
}

export type ProviderType = 'OpenAI' | 'Azure' | 'ZA';

export enum Locale {
  Chinese = 'cn',
  English = 'en',
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
  /**
   * 用户输入或者命令
   */
  content: string;
  status: 'ok' | 'error';
  role: 'user' | 'assistant' | 'system' | 'divider' | 'error';
  username: string;
  avatar: string;
  time: number;
  commandType?: DevPilotFunctionality;
  /**
   * 是否流式回答
   */
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
