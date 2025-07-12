import React from 'react';
import { useNotifications } from '../NotificationContext';

const GlobalNotifications: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      maxWidth: 350
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            background: notification.type === 'error' ? "#dc2626" : 
                       notification.type === 'success' ? "#059669" :
                       notification.type === 'warning' ? "#d97706" : "#2563eb",
            color: "white",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            animation: "slideInFromRight 0.3s ease-out",
            minWidth: 200
          }}
        >
          <div style={{ 
            fontWeight: 600,
            fontSize: 14,
            flex: 1
          }}>
            {notification.message}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: 18,
              padding: 0,
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.8,
              transition: "opacity 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.8"}
          >
            ×
          </button>
        </div>
      ))}
      
      {/* CSS for animations */}
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default GlobalNotifications; 