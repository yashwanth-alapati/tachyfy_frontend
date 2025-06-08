import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;

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
      .then(setTasks);
  }, [user, navigate]);

  return (
    <div style={{ padding: 32 }}>
      <h2>My Tasks</h2>
      {tasks.length === 0 && <div>No tasks yet.</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map(task => (
          <li
            key={task.id}
            style={{
              padding: 12,
              marginBottom: 10,
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 6,
              cursor: "pointer"
            }}
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <b>{task.title}</b> <span style={{ color: "#888" }}>({task.status})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;