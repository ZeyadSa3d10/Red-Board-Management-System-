import { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { setNotificationHandler } from '../../utils/toastService';

const GlobalToastListener = () => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    setNotificationHandler(addNotification);
  }, [addNotification]);

  return null;
};

export default GlobalToastListener;
