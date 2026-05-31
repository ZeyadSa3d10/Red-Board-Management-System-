let addNotif = null;

export const setNotificationHandler = (handler) => { addNotif = handler; };

export const toast = {
  success: (msg, duration) => addNotif?.(msg, 'success', duration),
  error: (msg, duration) => addNotif?.(msg, 'danger', duration),
  info: (msg, duration) => addNotif?.(msg, 'info', duration),
  warn: (msg, duration) => addNotif?.(msg, 'warning', duration),
};

export default toast;
