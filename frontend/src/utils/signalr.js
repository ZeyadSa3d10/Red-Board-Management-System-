import * as signalR from '@microsoft/signalr';

let connection = null;

export const startConnection = async () => {
  if (connection?.state === signalR.HubConnectionState.Connected) return connection;

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5193/api';
  const hubUrl = baseUrl.replace('/api', '/hub/notifications');

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, { withCredentials: true })
    .withAutomaticReconnect()
    .build();

  connection.onreconnecting(() => console.warn('SignalR reconnecting...'));
  connection.onreconnected(() => console.info('SignalR reconnected'));
  connection.onclose(() => console.warn('SignalR closed'));

  try {
    await connection.start();
    console.info('SignalR connected');
  } catch (err) {
    console.error('SignalR connection error:', err);
  }

  return connection;
};

export const stopConnection = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
  }
};

export const onNotification = (callback) => {
  if (connection) connection.on('Notification', callback);
};

export const offNotification = (callback) => {
  if (connection) connection.off('Notification', callback);
};

export default connection;
