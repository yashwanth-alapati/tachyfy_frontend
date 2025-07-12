import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "./NotificationContext";

const API_BASE = process.env.REACT_APP_API_URL;

const statusLabels = {
  processing: "Processing",
  needs_permission: "Needs Permission",
  complete: "Complete",
};

interface Task {
  id: string;
  title: string;
  status: string;
  state: number;
  created_at: string;
}

const TaskList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/tasks?email=${encodeURIComponent(user)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort tasks by created_at descending
      const sorted = data.sort((a: Task, b: Task) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTasks(sorted);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load only
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, [user, navigate, fetchTasks]);

  // Listen for custom events from chat components
  useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent) => {
      const { taskId, status, state } = event.detail;
      
      console.log('TaskList received task update:', { taskId, status, state });
      
      // First update local state immediately for quick feedback
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status, state }
            : task
        )
      );
      
      // Then fetch fresh data from server to ensure accuracy
      // Add a small delay to ensure backend has processed the update
      setTimeout(() => {
        fetchTasks();
      }, 500);
    };

    window.addEventListener('taskStateUpdate', handleTaskUpdate as EventListener);
    
    return () => {
      window.removeEventListener('taskStateUpdate', handleTaskUpdate as EventListener);
    };
  }, [fetchTasks]);

  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user }),
      });

      if (response.ok) {
        // Update the task status locally
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { ...task, status: 'complete', state: 1 }
              : task
          )
        );
        addNotification('Task completed successfully!', 'success');
      } else {
        throw new Error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      addNotification('Failed to complete task. Please try again.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 16, color: "#666" }}>Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
        <button 
          onClick={fetchTasks}
          style={{ 
            padding: "8px 16px", 
            cursor: "pointer",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Group tasks by status
  const grouped = {
    processing: tasks.filter(t => t.status === "processing"),
    needs_permission: tasks.filter(t => t.status === "needs_permission"),
    complete: tasks.filter(t => t.status === "complete"),
  };

  return (
    <div style={{ padding: 32, position: "relative" }}>
      <h2 style={{ margin: "0 0 24px 0" }}>My Tasks</h2>

      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#666" }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>No tasks yet</div>
          <div>Start a new chat to create your first task!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 24 }}>
          {/* Processing Tasks */}
          {grouped.processing.length > 0 && (
            <div>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: "50%", 
                  background: "#2563eb",
                  animation: "pulse 2s infinite"
                }}></div>
                Processing ({grouped.processing.length})
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                {grouped.processing.map(task => (
                <div
                  key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  style={{
                      padding: 16,
                    background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                    cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#2563eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {task.title}
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#2563eb",
                        animation: "pulse 1.5s infinite"
                      }}></div>
                      {statusLabels[task.status as keyof typeof statusLabels]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Needs Permission Tasks */}
          {grouped.needs_permission.length > 0 && (
            <div>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: "50%", 
                  background: "#dc2626"
                }}></div>
                Needs Permission ({grouped.needs_permission.length})
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                {grouped.needs_permission.map(task => (
                  <div
                    key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                    style={{
                      padding: 16,
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#dc2626";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {task.title}
                    </div>
                    <div style={{ 
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div style={{ 
                        fontSize: 14, 
                        color: "#dc2626",
                        fontWeight: 500
                      }}>
                        {statusLabels[task.status as keyof typeof statusLabels]}
                      </div>
                      <button
                        onClick={(e) => handleCompleteTask(task.id, e)}
                        style={{
                          padding: "6px 12px",
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#15803d";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#16a34a";
                        }}
                      >
                        Complete Task
                      </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* Complete Tasks */}
          {grouped.complete.length > 0 && (
            <div>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: "50%", 
                  background: "#16a34a"
                }}></div>
                Complete ({grouped.complete.length})
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                {grouped.complete.map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    style={{
                      padding: 16,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#16a34a";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.opacity = "0.8";
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {task.title}
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#16a34a"
                      }}></div>
                      ✓ {statusLabels[task.status as keyof typeof statusLabels]}
            </div>
          </div>
        ))}
      </div>
            </div>
          )}
        </div>
      )}

      {/* CSS for animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default TaskList;