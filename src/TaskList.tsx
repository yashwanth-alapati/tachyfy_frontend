import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;

const statusLabels = {
  processing: "Processing",
  needs_permission: "Needs Permission",
  complete: "Complete",
};

const TaskList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetch(`${API_BASE}/tasks?email=${encodeURIComponent(user)}`)
      .then(res => res.json())
      .then(data => {
        // Sort by created_at descending, safely
        const sorted = [...data].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setTasks(sorted);
      });
  }, [user, navigate]);

  // Group tasks by status
  const grouped = {
    processing: tasks.filter(t => t.status === "processing"),
    needs_permission: tasks.filter(t => t.status === "needs_permission"),
    complete: tasks.filter(t => t.status === "complete"),
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>My Tasks</h2>
      <div style={{ display: "flex", gap: 24 }}>
        {Object.entries(grouped).map(([status, tasks]) => (
          <div key={status} style={{ flex: 1, minWidth: 250 }}>
            <h3 style={{ textAlign: "center", marginBottom: 16 }}>{statusLabels[status as keyof typeof statusLabels]}</h3>
            <div style={{ background: "#fafafa", borderRadius: 8, minHeight: 200, padding: 12 }}>
              {tasks.length === 0 && <div style={{ color: "#aaa", textAlign: "center" }}>No tasks</div>}
              {tasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    padding: 12,
                    marginBottom: 10,
                    background: "#fff",
                    border: "1px solid #eee",
                    borderRadius: 6,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                  }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <b>{task.title}</b>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {task.created_at && new Date(task.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;