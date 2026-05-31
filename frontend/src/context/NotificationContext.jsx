import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

let notifIdCounter = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000, key) => {
    const id = Date.now() + (++notifIdCounter);
    const time = new Date().toISOString();
    setNotifications(prev => {
      let next = key ? prev.filter(n => n.key !== key) : [...prev];
      next = [...next, { id, message, type, key, time }];
      return next;
    });
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
