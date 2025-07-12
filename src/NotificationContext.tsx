import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

interface Notification {
  id: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type?: 'error' | 'success' | 'warning' | 'info') => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  setCurrentActiveSession: (sessionId: string | null) => void;
  currentActiveSession: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearAllNotifications: () => {},
  setCurrentActiveSession: () => {},
  currentActiveSession: null,
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentActiveSession, setCurrentActiveSession] = useState<string | null>(null);
  const { user } = useAuth();

  const addNotification = useCallback((message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: Notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen for task state updates
  useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent) => {
      const { taskId, status } = event.detail;
      
      console.log('NotificationProvider received task update:', { taskId, status, currentActiveSession });
      
      // Only show notification if:
      // 1. Task moved to needs_permission
      // 2. It's NOT the currently active session
      // 3. User is logged in
      if (status === 'needs_permission' && taskId !== currentActiveSession && user) {
        console.log('Showing notification for task:', taskId);
        
        // Get the current count of tasks needing permission
        fetch(`${process.env.REACT_APP_API_URL}/tasks?email=${encodeURIComponent(user)}`)
          .then(res => res.json())
          .then(data => {
            const needsPermissionCount = data.filter((task: any) => task.status === 'needs_permission').length;
            addNotification(`Need Permission (${needsPermissionCount})`, 'error');
          })
          .catch(error => {
            console.error('Error fetching task count:', error);
            addNotification('Need Permission', 'error');
          });
      }
    };

    window.addEventListener('taskStateUpdate', handleTaskUpdate as EventListener);
    
    return () => {
      window.removeEventListener('taskStateUpdate', handleTaskUpdate as EventListener);
    };
  }, [currentActiveSession, addNotification, user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
      setCurrentActiveSession,
      currentActiveSession
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 