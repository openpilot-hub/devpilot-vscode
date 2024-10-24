import vscode, { ExtensionContext, QuickPickItem, ThemeIcon } from 'vscode';
import l10n from '../l10n';
import eventsProvider from '@/providers/EventsProvider';

const getDisplayUserName = (context: ExtensionContext) => {
  const userName = context.globalState.get<string>('USER_NAME');
  const authType = context.globalState.get('AUTH_TYPE');
  if (userName && authType === 'wx') {
    return l10n.t('user.wechat') + '*' + userName.substring(userName.length - 4);
  }
  return userName;
};

function getStatusBarActions(context: ExtensionContext) {
  const token = context.globalState.get('TOKEN');
  const config = vscode.workspace.getConfiguration('devpilot');
  const autoComplete = config.get('autoCompletion') as boolean;
  const methodQuickOp = config.get('methodShortcut') !== 'hidden';

  const actions: (QuickPickItem & { fn: () => void; visible?: boolean })[] = [
    {
      label: l10n.t('account') + ': ' + getDisplayUserName(context),
      iconPath: new ThemeIcon('accounts-view-bar-icon'),
      visible: !!token,
    },
    {
      label: l10n.t('completion.title'),
      iconPath: new ThemeIcon(autoComplete ? 'notebook-state-success' : 'empty001'),
      fn() {
        config.update('autoCompletion', !autoComplete, true);
      },
    },
    {
      label: l10n.t('methodShortcut.title'),
      iconPath: new ThemeIcon(methodQuickOp ? 'notebook-state-success' : 'empty001'),
      fn() {
        config.update('methodShortcut', methodQuickOp ? 'hidden' : 'inline', true);
      },
    },
    {
      label: l10n.t('login.in'),
      iconPath: new ThemeIcon('log-in'),
      visible: !token,
      fn() {
        vscode.commands.executeCommand('devpilot.login');
      },
    } as any,
    {
      label: l10n.t('login.out'),
      iconPath: new ThemeIcon('log-out'),
      visible: !!token,
      fn() {
        vscode.commands.executeCommand('devpilot.logout');
        statusBar.changeFace('offline');
      },
    },
    {
      label: l10n.t('setting'),
      iconPath: new ThemeIcon('settings-gear'),
      fn() {
        vscode.commands.executeCommand('workbench.action.openSettings', 'devpilot');
      },
    },
  ];

  return actions;
}

let barItem: vscode.StatusBarItem;

const statusBar = {
  create(context: ExtensionContext) {
    const token = context.globalState.get('TOKEN');
    // status bar click handler
    const CommandId = 'devpilot.statusBarClick';

    context.subscriptions.push(
      vscode.commands.registerCommand(CommandId, async () => {
        const BAR_ACTIONS = getStatusBarActions(context).filter((item) => item.visible !== false);
        const option = await vscode.window.showQuickPick(BAR_ACTIONS, {
          title: 'DevPilot',
          placeHolder: l10n.t('operation.quickpick.placeholder'),
        });
        const action = BAR_ACTIONS.find((item) => item.label === option?.label);
        action?.fn?.();
      })
    );

    eventsProvider.onLogin.event((status) => {
      statusBar.changeFace(status === 1 ? 'online' : 'offline');
    });

    eventsProvider.onFetchCompletion.event((status) => {
      statusBar.changeFace(status === 'START' ? 'loading' : 'online');
    });

    barItem = vscode.window.createStatusBarItem('logo', vscode.StatusBarAlignment.Right, 100);
    barItem.name = 'DevPilot';
    barItem.command = CommandId;
    statusBar.changeFace(token ? 'online' : 'offline');
    barItem.show();

    context.subscriptions.push(barItem);
  },

  changeFace(type: 'offline' | 'online' | 'loading') {
    if (type === 'offline') {
      barItem.text = '$(devpilot-logo-offline)';
      barItem.tooltip = l10n.t('login.fail');
    } else if (type === 'online') {
      barItem.text = '$(devpilot-logo)';
      barItem.tooltip = 'DevPilot';
    } else if (type === 'loading') {
      barItem.tooltip = l10n.t('fetch.completion');
      barItem.text = '$(loading~spin)';
    }
  },
};

export default statusBar;
