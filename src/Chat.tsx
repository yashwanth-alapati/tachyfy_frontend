import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';

// Map tool IDs to backend tool names
const toolMappings = {
  "gmail": "gmail_mcp",
  "calendar": "google_calendar_mcp", 
  "websearch": "web_search"
};

const tools = [
  { name: "Gmail", id: "gmail" },
  { name: "Google Calendar", id: "calendar" },
  { name: "Web Search", id: "websearch" },
  // Add more tools here as they become available
];

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentActiveSession } = useNotifications();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update the current active session for notifications
  useEffect(() => {
    setCurrentActiveSession(currentSessionId);
  }, [currentSessionId, setCurrentActiveSession]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      setCurrentActiveSession(null);
    };
  }, [setCurrentActiveSession]);

  // Load selected tools from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedTools_chat');
    if (saved) {
      try {
        setSelectedTools(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading selected tools:", error);
      }
    }
  }, []);

  // Save selected tools to localStorage
  useEffect(() => {
    localStorage.setItem('selectedTools_chat', JSON.stringify(selectedTools));
  }, [selectedTools]);

  // MODIFY tool loading to auto-select all tools
  useEffect(() => {
    const saved = localStorage.getItem('selectedTools_chat');
    if (saved) {
      try {
        const savedTools = JSON.parse(saved);
        setSelectedTools(savedTools);
      } catch (error) {
        console.error("Error loading selected tools:", error);
        // If loading fails, auto-select all tools
        const allToolIds = tools.map(tool => tool.id);
        setSelectedTools(allToolIds);
      }
    } else {
      // Auto-select all tools by default
      const allToolIds = tools.map(tool => tool.id);
      setSelectedTools(allToolIds);
    }
  }, []);

  // Load session messages
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading session messages:", error);
    }
  }, [user]);

  // Restore session on page load
  useEffect(() => {
    const savedSessionId = localStorage.getItem('currentChatSessionId');
    if (savedSessionId && !currentSessionId) {
      setCurrentSessionId(savedSessionId);
      loadSessionMessages(savedSessionId);
    }
  }, [currentSessionId, loadSessionMessages]);

  // Emit custom event for task state updates
  const emitTaskUpdate = (sessionId: string, status: string, state: number) => {
    const event = new CustomEvent('taskStateUpdate', {
      detail: { taskId: sessionId, status, state }
    });
    window.dispatchEvent(event);
  };

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
    const currentInput = input;
    setInput("");
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    try {
      // Build URL with session_id if we have one
      let url = `${API_BASE}/tasks`;
      if (currentSessionId) {
        url += `?session_id=${currentSessionId}`;
      }
      
      // Convert selected tool IDs to backend tool names
      const backendToolNames = selectedTools.map(toolId => toolMappings[toolId as keyof typeof toolMappings]).filter(Boolean);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentInput, 
          email: user,
          selected_tools: backendToolNames
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const newTask = await res.json();
      console.log("📧 Chat response:", newTask);
      
      // Store session ID from first response
      let sessionId = currentSessionId;
      if (!currentSessionId && newTask.session_id) {
        sessionId = newTask.session_id;
        setCurrentSessionId(sessionId);
        if (sessionId) {
          localStorage.setItem('currentChatSessionId', sessionId);
        }
      }
      
      setMessages(newTask.messages || []);
      setError(null);
      
      // Emit task update event with delay - AI has responded, so task needs permission
      if (sessionId && sessionId.trim() !== '') {
        const validSessionId = sessionId; // TypeScript will know this is not null
        setTimeout(() => {
          emitTaskUpdate(validSessionId, 'needs_permission', 0);
        }, 50);
      }
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.log("Request timed out - but may still be processing");
        setError("Request is taking longer than expected. Please check back in a moment.");
        setLastFailedMessage(currentInput);
      } else {
        console.error("Error sending message:", error);
        setError("Failed to send message. Please try again.");
        setLastFailedMessage(currentInput);
      }
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Add this new function to handle Enter key behavior
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-expand textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading && !isSubmitting) {
        handleSend(e);
      }
    }
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Selected file: ${file.name}`);
    }
  };

  // Add function to start new chat
  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
    // Clear from localStorage
    localStorage.removeItem('currentChatSessionId');
  };
  
  // Add this effect to auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const retryLastMessage = async () => {
    if (lastFailedMessage) {
      setInput(lastFailedMessage);
      setLastFailedMessage("");
      setError(null);
      // The user can then click send again
    }
  };

  return (
    <div style={{ 
      maxWidth: "1200px",
      width: "90%",
      margin: "0 auto", 
      padding: "20px",
      minHeight: "calc(100vh - 100px)"
    }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 20
      }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: "#1f2937", 
            margin: 0 
          }}>
            Tachyfy
          </h1>
          <p style={{ 
            color: "#6b7280", 
            margin: "4px 0 0 0",
            fontSize: 16
          }}>
            FTL: Flow Through Life
          </p>
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          style={{
            padding: "8px 16px",
            background: "#374151",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#374151";
          }}
        >
          ✨ New Chat
        </button>
      </div>

      {/* Messages Container */}
      <div style={{ 
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        marginBottom: 20,
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        {/* Messages Area */}
        <div style={{ 
          padding: "24px",
          minHeight: 400,
          maxHeight: 600,
          overflowY: "auto"
        }}>
          {messages.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              color: "#6b7280", 
              padding: "60px 20px"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                Ready to help!
              </div>
              <div style={{ fontSize: 14 }}>
                Select tools and start a conversation
              </div>
            </div>
          )}
          
          {messages.map((msg: any, idx: number) => (
            <div key={idx} style={{ 
              marginBottom: 20,
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              <div style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: 12,
                background: msg.role === "user" ? "#f7df02" : "#f1f5f9",
                color: msg.role === "user" ? "#000" : "#1e293b"
              }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: msg.role === "user" ? "#666" : "#64748b", 
                  marginBottom: 4 
                }}>
                  {msg.role === "user" ? "You" : "AI Assistant"}
                </div>
                <div style={{ 
                  lineHeight: 1.6,
                  fontSize: 14
                }}>
                  {typeof msg.message === 'string' ? msg.message :
                   typeof msg.message === 'object' ? JSON.stringify(msg.message) :
                   String(msg.message)}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{ 
              marginBottom: 20,
              display: "flex",
              justifyContent: "flex-start"
            }}>
              <div style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: 12,
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                {/* Simple spinning loader */}
                <div style={{
                  width: 16,
                  height: 16,
                  border: "2px solid #e2e8f0",
                  borderTopColor: "#64748b",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: "#64748b"
                }}>
                  AI Assistant
                </div>
              </div>
            </div>
          )}
          
          {loading && (
            <div style={{
              fontSize: 11,
              color: "#9ca3af",
              textAlign: "center",
              marginTop: 8,
              fontStyle: "italic"
            }}>
              💡 If this takes too long, you can refresh the page to check for responses
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div style={{ 
          padding: "16px 20px",
          background: "#fff",
          borderRadius: "0 0 16px 16px",
          position: "relative"
        }}>
          {/* Error Display */}
          {error && (
            <div style={{ 
              color: "red", 
              marginBottom: 12,
              padding: "12px",
              background: "#fef2f2",
              borderRadius: 8,
              border: "1px solid #fecaca"
            }}>
              <div>{error}</div>
              {lastFailedMessage && (
                <button
                  onClick={retryLastMessage}
                  style={{
                    marginTop: 8,
                    padding: "4px 8px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  🔄 Retry Message
                </button>
              )}
            </div>
          )}
          
          <form onSubmit={handleSend} style={{ 
            display: "flex", 
            alignItems: "flex-end", // Changed from "center" to "flex-end"
            background: "#f8f9fa",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "8px 12px"
          }}>
            {/* Tools and File Buttons */}
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
              
              {/* Tools Display (Auto-selected) */}
              <div
                style={{
                  marginRight: 8,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  color: "#374151",
                  fontSize: 12,
                  fontWeight: 500
                }}
                title="All tools are automatically selected and active"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <span style={{ marginRight: 8 }}>📧📅🔍</span>
                <span>All Tools Active</span>
              </div>
              
            </div>

            {/* Auto-expanding Input Field */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              style={{ 
                flex: 1,
                padding: "10px 0", 
                border: "none",
                fontSize: 16,
                outline: "none",
                background: "transparent",
                color: "#374151",
                resize: "none",
                minHeight: "24px",
                maxHeight: "120px", // About 5 lines
                overflow: "hidden",
                lineHeight: "1.5",
                fontFamily: "inherit"
              }}
              placeholder={loading ? "Waiting for response..." : "Ask anything"}
              disabled={false}
              rows={1}
            />
            
            {/* Send Button */}
            <button 
              type="submit" 
              style={{ 
                padding: "8px",
                borderRadius: 6,
                background: (input.trim() && !loading && !isSubmitting) ? "#222" : "#e5e7eb",
                color: (input.trim() && !loading && !isSubmitting) ? "#fff" : "#9ca3af",
                border: "none",
                cursor: (input.trim() && !loading && !isSubmitting) ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                marginLeft: 8
              }} 
              disabled={!input.trim() || loading || isSubmitting}
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
        </div>
      </div>
    </div>
  );
};

export default Chat;