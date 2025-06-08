import React, { useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL;

const CreateTask: React.FC = () => {
  const [title, setTitle] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Task creation failed");
      } else {
        setSuccess("Task created!");
        setTitle("");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, borderRadius: 12, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <h2>Create Task</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 16 }}
        />
        <button type="submit" style={{ width: "100%", padding: 12, borderRadius: 8, background: "#f7df02", fontWeight: 700, fontSize: 16, border: "none" }}>
          Create
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
        {success && <div style={{ color: "green", marginTop: 12 }}>{success}</div>}
      </form>
    </div>
  );
};

export default CreateTask;