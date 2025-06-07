import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
interface Message {
  sender: "user" | "bot";
  text: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: "user", text: input };
    setMessages((msgs) => [...msgs, userMessage]);

    // Call backend
    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await response.json();
    const botMessage: Message = { sender: "bot", text: data.reply };
    setMessages((msgs) => [...msgs, botMessage]);
    setInput("");
  };

  // Example tools list
  const tools = [
    { name: "Calendar", description: "Manage your events" },
    { name: "Reminders", description: "Set a reminder" },
    { name: "Notes", description: "Take a quick note" },
  ];

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        border: "1px solid #e0e0e0",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        background: "#fafbfc",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        height: "80vh",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                background: msg.sender === "user" ? "#1976d2" : "#e3e6ea",
                color: msg.sender === "user" ? "#fff" : "#222",
                borderRadius: 16,
                padding: "10px 18px",
                maxWidth: "70%",
                fontSize: 16,
                boxShadow: msg.sender === "user"
                  ? "0 2px 8px rgba(25,118,210,0.08)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div
        style={{
          borderTop: "1px solid #e0e0e0",
          padding: 16,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          position: "relative", // <-- Added for dropdown positioning
        }}
      >
        {/* Tools Button + Dropdown Container */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <button
            type="button"
            id="system-hint-button"
            aria-haspopup="menu"
            aria-expanded={toolsOpen}
            className="composer-btn"
            aria-label="Choose tool"
            style={{
              marginRight: 12,
              background: "#f5f7fa",
              border: "1px solid #cfd8dc",
              borderRadius: 8,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              position: "relative",
              zIndex: 11,
            }}
            onClick={() => setToolsOpen((open) => !open)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="" style={{marginRight: 6}}>
              <path fillRule="evenodd" clipRule="evenodd" d="M14.5 5C13.3954 5 12.5 5.89543 12.5 7C12.5 8.10457 13.3954 9 14.5 9C15.6046 9 16.5 8.10457 16.5 7C16.5 5.89543 15.6046 5 14.5 5ZM10.626 6C11.0701 4.27477 12.6362 3 14.5 3C16.3638 3 17.9299 4.27477 18.374 6H20C20.5523 6 21 6.44772 21 7C21 7.55228 20.5523 8 20 8H18.374C17.9299 9.72523 16.3638 11 14.5 11C12.6362 11 11.0701 9.72523 10.626 8H4C3.44772 8 3 7.55228 3 7C3 6.44772 3.44772 6 4 6H10.626ZM9.5 15C8.39543 15 7.5 15.8954 7.5 17C7.5 18.1046 8.39543 19 9.5 19C10.6046 19 11.5 18.1046 11.5 17C11.5 15.8954 10.6046 15 9.5 15ZM5.62602 16C6.07006 14.2748 7.63616 13 9.5 13C11.3638 13 12.9299 14.2748 13.374 16H20C20.5523 16 21 16.4477 21 17C21 17.5523 20.5523 18 20 18H13.374C12.9299 19.7252 11.3638 21 9.5 21C7.63616 21 6.07006 19.7252 5.62602 18H4C3.44772 18 3 17.5523 3 17C3 16.4477 3.44772 16 4 16H5.62602Z" fill="currentColor"></path>
            </svg>
            <span style={{marginLeft: 2}}>Tools</span>
          </button>
          {/* Tools Dropdown */}
          {toolsOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "110%", // Show above the button
                left: 0,
                background: "#fff",
                border: "1px solid #cfd8dc",
                borderRadius: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                zIndex: 12,
                minWidth: 200,
                padding: 8,
              }}
            >
              <div style={{fontWeight: 600, marginBottom: 8, fontSize: 15}}>Available Tools</div>
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "background 0.15s",
                    marginBottom: 2,
                    fontSize: 15,
                  }}
                  onClick={() => {
                    setInput(tool.name + ": ");
                    setToolsOpen(false);
                  }}
                  onMouseDown={e => e.preventDefault()}
                >
                  <div style={{fontWeight: 500}}>{tool.name}</div>
                  <div style={{fontSize: 13, color: "#666"}}>{tool.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #cfd8dc",
            fontSize: 16,
            outline: "none",
            marginRight: 12,
            background: "#f5f7fa",
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;