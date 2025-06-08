import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!user) {
      navigate("/login");
      return;
    }
    // Create a new task with the message
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, email: user }),
    });
    const newTask = await res.json();
    setMessages(newTask.messages || []);
    setInput("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Chat with easydoAI</h2>
      <form onSubmit={handleSend} style={{ marginBottom: 24 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ width: "70%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
          placeholder="Type your query..."
        />
        <button type="submit" style={{ marginLeft: 12, padding: "10px 24px", borderRadius: 6, background: "#222", color: "#fff", border: "none" }}>
          Send
        </button>
      </form>
      <div>
        {messages.map((msg: any, idx: number) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chat;