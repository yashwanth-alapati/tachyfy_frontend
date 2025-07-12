import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';

const tools = [
  { name: "Google Calendar", id: "calendar" },
  { name: "Gmail", id: "gmail" },
  { name: "Slack", id: "slack" },
  { name: "Notion", id: "notion" },
  { name: "Zoom", id: "zoom" },
  { name: "Web Search", id: "websearch" },
  // Add more tools here
];

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // ✅ Track session
  const [showTools, setShowTools] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || isSubmitting) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setIsSubmitting(true);
    
    // Add user message to display immediately
    const userMessage = { role: "user", message: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input; // Store current input
    setInput(""); // Clear input immediately
    
    try {
      // Build URL with session_id if we have one
      let url = `${API_BASE}/tasks`;
      if (currentSessionId) {
        url += `?session_id=${currentSessionId}`;
      }
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, email: user }),
      });
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const newTask = await res.json();
      console.log("📧 Chat response:", newTask); // DEBUG
      console.log("📧 Messages in response:", newTask.messages); // DEBUG
      
      // Store session ID from first response
      if (!currentSessionId && newTask.session_id) {
        setCurrentSessionId(newTask.session_id);
      }
      
      // ✅ FIXED: Always update messages like TaskChat does
      setMessages(newTask.messages || []);
      console.log("📧 Messages state updated"); // DEBUG
      
      setError(null);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleToolClick = (toolName: string) => {
    setShowTools(false);
    setInput(prev => `[${toolName}] ` + prev);
    setSearch("");
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // You can implement file upload logic here
      alert(`Selected file: ${file.name}`);
    }
  };

  // Filter tools based on search
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle click outside to close tools dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTools &&
        toolsDropdownRef.current &&
        toolsButtonRef.current &&
        !toolsDropdownRef.current.contains(event.target as Node) &&
        !toolsButtonRef.current.contains(event.target as Node)
      ) {
        setShowTools(false);
        setSearch("");
      }
    };

    if (showTools) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTools]);

  // ✅ Add function to start new chat
  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
  };
  
  // Add this effect to auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: "40px auto", 
      background: "#fff", 
      borderRadius: 12, 
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
      padding: 32,
      minHeight: "60vh"
    }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: "#222", 
          marginBottom: 8 
        }}>
          Chat with Tachify
        </h1>
        <p style={{ color: "#666", fontSize: 16 }}>
          Ask me anything! I can help with emails, calendar, tasks, and much more.
        </p>
        {/* ✅ Add New Chat button if there's an active session */}
        {currentSessionId && (
          <button
            onClick={startNewChat}
            style={{
              marginTop: 8,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#666",
              cursor: "pointer",
              fontSize: 14
            }}
          >
            + Start New Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div style={{ 
        marginBottom: 24, 
        minHeight: 200, 
        maxHeight: 400, 
        overflowY: "auto",
        padding: "16px 0"
      }}>
        {messages.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            color: "#888", 
            fontStyle: "italic",
            padding: "40px 20px"
          }}>
            Start a conversation by typing a message below...
          </div>
        )}
        {messages.map((msg: any, idx: number) => (
          <div key={idx} style={{ 
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: msg.role === "user" ? "#f7df02" : "#f8f9fa",
            marginLeft: msg.role === "user" ? "20%" : "0",
            marginRight: msg.role === "user" ? "0" : "20%"
          }}>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: "#666", 
              marginBottom: 4 
            }}>
              {msg.role === "user" ? "You" : "AI Assistant"}
            </div>
            <div style={{ lineHeight: 1.5 }}>{msg.message}</div>
          </div>
        ))}
        {loading && (
          <div style={{ 
            color: "#888", 
            fontStyle: "italic", 
            marginTop: 12,
            textAlign: "center",
            padding: "16px"
          }}>
            <span>🤔 AI is thinking...</span>
          </div>
        )}
        {error && (
          <div style={{ 
            padding: "12px", 
            background: "#fee", 
            color: "#c53030", 
            borderRadius: 8, 
            marginBottom: 16 
          }}>
            {error}
            <button 
              onClick={() => setError(null)}
              style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={{ 
        display: "flex", 
        alignItems: "center",
        background: "#fff",
        border: "2px solid #e5e7eb",
        borderRadius: 12,
        padding: "8px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "border-color 0.2s ease"
      }}
      onFocus={() => {
        const form = document.querySelector('form');
        if (form) form.style.borderColor = "#f7df02";
      }}
      onBlur={() => {
        const form = document.querySelector('form');
        if (form) form.style.borderColor = "#e5e7eb";
      }}
      >
        {/* Tools and File Buttons - Inside Input Container */}
        <div style={{ display: "flex", alignItems: "center", position: "relative", marginRight: 8 }}>
          {/* Attach File Button */}
          <button
            type="button"
            onClick={handleAttachClick}
            style={{
              marginRight: 4,
              padding: "6px",
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#6b7280",
              transition: "all 0.2s ease"
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }}
            title="Attach file"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          
          {/* Tools Button */}
          <button
            ref={toolsButtonRef}
            type="button"
            onClick={() => setShowTools(v => !v)}
            style={{
              marginRight: 8,
              padding: "6px",
              borderRadius: 6,
              border: "none",
              background: showTools ? "#f3f4f6" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: showTools ? "#374151" : "#6b7280",
              transition: "all 0.2s ease"
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!showTools) {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (!showTools) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
            title="Select tools"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </button>
          
          {/* Tools Dropdown */}
          {showTools && (
            <div 
              ref={toolsDropdownRef}
              style={{
                position: "absolute",
                left: 0,
                bottom: "calc(100% + 8px)",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                zIndex: 10,
                minWidth: 180,
                maxWidth: 200,
                overflow: "hidden"
              }}
            >
              <div style={{ 
                padding: "8px 12px",
                borderBottom: "1px solid #f3f4f6"
              }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    background: "#f9fafb",
                    outline: "none"
                  }}
                  autoFocus
                />
              </div>
              <div style={{ 
                maxHeight: "120px",
                overflowY: "auto"
              }}>
                {filteredTools.length === 0 && (
                  <div style={{ padding: "12px", color: "#6b7280", textAlign: "center", fontSize: 13 }}>
                    No tools found
                  </div>
                )}
                {filteredTools.map(tool => (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool.name)}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#374151",
                      transition: "background-color 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      minHeight: "40px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span style={{ marginRight: 6, fontSize: 14 }}>
                      {tool.id === 'gmail' ? '📧' : 
                       tool.id === 'calendar' ? '📅' : 
                       tool.id === 'slack' ? '💬' : 
                       tool.id === 'notion' ? '📝' : 
                       tool.id === 'zoom' ? '🎥' : 
                       tool.id === 'websearch' ? '🔍' : '🛠️'}
                    </span>
                    {tool.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Field */}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ 
            flex: 1,
            padding: "12px 0", 
            border: "none",
            fontSize: 16,
            outline: "none",
            background: "transparent",
            color: "#374151"
          }}
          placeholder="Message Tachify..."
          disabled={loading}
        />
        
        {/* Send Button */}
        <button 
          type="submit" 
          style={{ 
            padding: "8px",
            borderRadius: 8,
            background: input.trim() && !loading ? "#222" : "#e5e7eb",
            color: input.trim() && !loading ? "#fff" : "#9ca3af",
            border: "none",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            marginLeft: 8
          }} 
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m22 2-7 20-4-9-9-4z"/>
              <path d="M22 2 11 13"/>
            </svg>
          )}
        </button>
      </form>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Chat;