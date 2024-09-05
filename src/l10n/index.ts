import vscode from 'vscode';

// vscode 自带的l10n处理长文本比较麻烦，这里我们自己实现一个简单的l10n
// 只支持 {var name} 插值，不支持索引插值

const langs: Record<string, Record<string, string>> = {
  en: {
    'login.in': 'Login',
    'login.out': 'Logout',
    setting: 'Advanced Settings',
    login: 'Log in',
    welcome: "Hi, I'm DevPilot，your AI-Infused code copilot. Log in and start an AI journey!",
    'msg.signin': 'Sign in to use DevPilot.',
    'msg.empty_selection': 'No code selected!',
    dismiss: 'Dismiss',
    'login.success': 'Login success',
    'chat.login': 'I am going to login...',
    'login.fail': 'DevPilot: Not login or login expired',
    'completion.title': 'Auto Completion',
    'methodShortcut.title': 'Method Shortcut',
    'operation.fix': 'Fix this',
    'operation.fix_s': 'Fix',
    'operation.explain': 'Explain this',
    'operation.explain_s': 'Explain',
    'operation.test': 'Generate Tests',
    'operation.test_s': 'Test',
    'operation.performance': 'Check performance',
    'operation.review': 'Code review',
    'operation.comment': 'Generate Comments',
    'operation.comment_s': 'Comments',
    'operation.summary': 'Summary this',
    'operation.summary_s': 'Summary',
    'operation.quickpick.placeholder': 'select an action...',
    'git.nostaged': 'No staged changes!',
    account: 'Account',
    'fetch.completion': 'Fetching completions...',
    'user.wechat': 'Wechat',
    'network.offline': 'Network is not available, Please check your network connection',
    'network.setting': 'Check Setting',
  },
  'zh-cn': {
    'login.in': '登录',
    'login.out': '登出',
    setting: '高级设置',
    login: '立即登录',
    welcome: '你好，我是DevPilot，你的AI代码助理。登录并开始AI之旅吧！',
    'msg.signin': '登录以使用DevPilot。',
    'msg.empty_selection': '未选中任何代码!',
    dismiss: '忽略',
    'login.success': '登录成功',
    'chat.login': '准备重新登录...',
    'login.fail': 'DevPilot: 未登录或者登录过期',
    'completion.title': '代码补全',
    'methodShortcut.title': '方法上快捷操作',
    'operation.fix': '修复代码',
    'operation.fix_s': '修复代码',
    'operation.explain': '解释代码',
    'operation.explain_s': '解释代码',
    'operation.test': '生成单测',
    'operation.test_s': '生成单测',
    'operation.performance': '检查性能',
    'operation.review': '代码检查',
    'operation.comment': '生成注释',
    'operation.comment_s': '单行注释',
    'operation.summary': '函数注释',
    'operation.summary_s': '函数注释',
    'operation.quickpick.placeholder': '请选择要执行的操作...',
    'git.nostaged': '未找到已暂存的修改！',
    account: '账号',
    'fetch.completion': '获取代码补全...',
    'user.wechat': '微信用户',
    'network.offline': '网络连接超时，请检查网络连接',
    'network.setting': '状态检查配置',
  },
};

const lang = langs[vscode.env.language] || langs.en;

export default {
  t: (key: string, data?: Record<string, string>) => {
    let text = lang[key] || key;
    if (data) {
      Object.keys(data).forEach((k) => {
        text = text.replace(new RegExp(`\{${k}\}`, 'g'), data[k]);
      });
    }
    return text;
  },
};
