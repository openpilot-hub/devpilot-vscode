import vscode from 'vscode';
import axios from 'axios';
import { getConfiguration } from '.';
import l10n from '@/l10n';
import { API, PUBLIC_API } from '@/env';

let _networkCheckingTimer: NodeJS.Timeout;
let _networkCheckingInterval = 2 * 3600 * 1000;
let _networkCheckingLastTime = 0;

export function stopCheckingNetwork() {
  if (_networkCheckingTimer) {
    clearTimeout(_networkCheckingTimer);
  }
}

/**
 * to check network status. If the network is offline, it will inform the user to check the network status.
 * @param authType authraization type. NOTE: DO NOT use `LoginController.instance.getLoginInfo()` to get authType here, because it maight cause circular import.
 * @returns
 */
export function checkingNetwork(authType: string) {
  if (Date.now() - _networkCheckingLastTime < _networkCheckingInterval) {
    // too frequent. ignore!
    return Promise.resolve();
  }
  const enableNetworkChecking = getConfiguration('networkChecking', true);
  if (!enableNetworkChecking) {
    stopCheckingNetwork();
    return Promise.resolve();
  }
  _networkCheckingLastTime = Date.now();
  return axios.get(['za', 'za_ti'].includes(authType!) ? API : PUBLIC_API).catch((err) => {
    if (err?.response?.data) {
      // the network is back
      stopCheckingNetwork();
    } else {
      // inform the user
      const buttons = [l10n.t('network.setting'), l10n.t('dismiss')];
      vscode.window.showWarningMessage(l10n.t('network.offline'), ...buttons).then((res) => {
        if (res === buttons[0]) {
          vscode.commands.executeCommand('workbench.action.openSettings', 'devpilot');
        }
      });
      // check every 2 hours
      _networkCheckingTimer = setTimeout(() => checkingNetwork(authType), _networkCheckingInterval);
      return Promise.reject();
    }
  });
}
