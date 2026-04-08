export const PWA_ACTION_FEEDBACK_TTL_MS = 4000;

export function shouldEnableNotificationsAfterInstallAction({ alreadyInstalled = false, installAvailable = false, installAccepted = false } = {}) {
  return !!alreadyInstalled || !!installAccepted || !installAvailable;
}

export function getPwaActionSuccessMessageKey({ actionKey = '', installDone = false, pushEnabled = false } = {}) {
  const key = String(actionKey || '').trim();
  if (!key) return '';

  if (key === 'install_only') {
    return installDone ? 'tour.pwaNudge.success.install' : '';
  }

  if (key === 'notify_only') {
    return pushEnabled ? 'tour.pwaNudge.success.notify' : '';
  }

  if (key === 'install_and_notify') {
    if (installDone && pushEnabled) return 'tour.pwaNudge.success.installAndNotify';
    if (installDone) return 'tour.pwaNudge.success.install';
    if (pushEnabled) return 'tour.pwaNudge.success.notify';
  }

  return '';
}