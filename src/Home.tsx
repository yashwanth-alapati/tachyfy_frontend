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
];

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

interface TaskConversationState {
  messages: any[];
  loading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastFailedMessage: string;
  selectedTools: string[];
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentActiveSession, addNotification } = useNotifications();
  const navigate = useNavigate();

  // Task List State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('leftPanelWidth');
    return saved ? parseInt(saved) : 35; // Default 35%
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Per-task conversation states
  const [taskStates, setTaskStates] = useState<Record<string, TaskConversationState>>({});
  
  // New chat state (for creating new tasks)
  const [newChatState, setNewChatState] = useState<TaskConversationState>({
    messages: [],
    loading: false,
    isSubmitting: false,
    error: null,
    lastFailedMessage: "",
    selectedTools: []
  });

  // Chat input state (shared across all chats)
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false); // Add this new state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save panel width to localStorage
  useEffect(() => {
    localStorage.setItem('leftPanelWidth', leftPanelWidth.toString());
  }, [leftPanelWidth]);

  // Handle panel resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 70%
    const constrainedWidth = Math.min(Math.max(newLeftWidth, 20), 70);
    setLeftPanelWidth(constrainedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add mouse move and up listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Get current conversation state
  const getCurrentState = useCallback((): TaskConversationState => {
    if (selectedTaskId) {
      return taskStates[selectedTaskId] || {
        messages: [],
        loading: false,
        isSubmitting: false,
        error: null,
        lastFailedMessage: "",
        selectedTools: []
      };
    }
    return newChatState;
  }, [selectedTaskId, taskStates, newChatState]);

  // Update current conversation state
  const updateCurrentState = useCallback((updates: Partial<TaskConversationState>) => {
    if (selectedTaskId) {
      setTaskStates(prev => ({
        ...prev,
        [selectedTaskId]: {
          ...getCurrentState(),
          ...updates
        }
      }));
    } else {
      setNewChatState(prev => ({
        ...prev,
        ...updates
      }));
    }
  }, [selectedTaskId, getCurrentState]);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

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

  // Load selected tools from localStorage when task changes
  useEffect(() => {
    const currentState = getCurrentState();
    const storageKey = selectedTaskId ? `selectedTools_${selectedTaskId}` : 'selectedTools_chat';
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const savedTools = JSON.parse(saved);
        updateCurrentState({ selectedTools: savedTools });
      } catch (error) {
        console.error("Error loading selected tools:", error);
      }
    } else if (currentState.selectedTools.length === 0) {
      // Only reset if no tools are already selected
      updateCurrentState({ selectedTools: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId]);

  // Save selected tools to localStorage when they change
  const currentStateSelectedTools = getCurrentState().selectedTools;
  useEffect(() => {
    const storageKey = selectedTaskId ? `selectedTools_${selectedTaskId}` : 'selectedTools_chat';
    localStorage.setItem(storageKey, JSON.stringify(currentStateSelectedTools));
  }, [currentStateSelectedTools, selectedTaskId]);

  // Load task conversation messages
  const loadTaskMessages = useCallback(async (taskId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setTaskStates(prev => ({
          ...prev,
          [taskId]: {
            ...(prev[taskId] || {
              loading: false,
              isSubmitting: false,
              error: null,
              lastFailedMessage: "",
              selectedTools: []
            }),
            messages: data.messages || []
          }
        }));
      }
    } catch (error) {
      console.error("Error loading task messages:", error);
    }
  }, [user]);

  // Load session messages (for new chats)
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setNewChatState(prev => ({
          ...prev,
          messages: data.messages || []
        }));
      }
    } catch (error) {
      console.error("Error loading session messages:", error);
    }
  }, [user]);

  // Restore session on page load (only if no task is selected)
  useEffect(() => {
    if (!selectedTaskId) {
      const savedSessionId = localStorage.getItem('currentChatSessionId');
      if (savedSessionId && !currentSessionId) {
        setCurrentSessionId(savedSessionId);
        loadSessionMessages(savedSessionId);
      }
    }
  }, [currentSessionId, loadSessionMessages, selectedTaskId]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setTasksError(null);
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
      setTasksError("Failed to load tasks");
    } finally {
      setIsTasksLoading(false);
    }
  }, [user]);

  // Initial load of tasks
  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user, fetchTasks]);

  // Listen for custom events from chat components
  useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent) => {
      const { taskId, status, state } = event.detail;
      
      console.log('Home received task update:', { taskId, status, state });
      
      // Update task status and clear loading state for that specific task
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status, state }
            : task
        )
      );

      // Clear loading state for the specific task
      setTaskStates(prev => ({
        ...prev,
        [taskId]: {
          ...(prev[taskId] || {
            messages: [],
            error: null,
            lastFailedMessage: "",
            selectedTools: []
          }),
          loading: false,
          isSubmitting: false
        }
      }));
      
      // Then fetch fresh data from server to ensure accuracy
      setTimeout(() => {
        fetchTasks();
      }, 500);
    };

    window.addEventListener('taskStateUpdate', handleTaskUpdate as EventListener);
    
    return () => {
      window.removeEventListener('taskStateUpdate', handleTaskUpdate as EventListener);
    };
  }, [fetchTasks]);

  // Emit custom event for task state updates
  const emitTaskUpdate = (sessionId: string, status: string, state: number) => {
    const event = new CustomEvent('taskStateUpdate', {
      detail: { taskId: sessionId, status, state }
    });
    window.dispatchEvent(event);
  };

  // Handle task selection
  const handleTaskSelect = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentSessionId(taskId);
    
    // Load messages if not already loaded
    if (!taskStates[taskId]?.messages) {
      await loadTaskMessages(taskId);
    }
    
    // Clear input and reset any error states for the new selection
    setInput("");
    updateCurrentState({ error: null, lastFailedMessage: "" });
  };

  // Handle complete task
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
        
        // Emit task update event
        emitTaskUpdate(taskId, 'complete', 1);
      } else {
        throw new Error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      addNotification('Failed to complete task. Please try again.', 'error');
    }
  };

  // Add function to start new chat
  const startNewChat = () => {
    setSelectedTaskId(null);
    setCurrentSessionId(null);
    setInput("");
    setNewChatState({
      messages: [],
      loading: false,
      isSubmitting: false,
      error: null,
      lastFailedMessage: "",
      selectedTools: []
    });
    // Clear from localStorage
    localStorage.removeItem('currentChatSessionId');
  };

  // Chat send handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentState = getCurrentState();
    
    if (!input.trim() || currentState.loading || currentState.isSubmitting) return;
    if (!user) {
      navigate("/login");
      return;
    }

    // Update loading state for current conversation only
    updateCurrentState({ 
      loading: true, 
      isSubmitting: true 
    });
    
    // If this is a new task creation, set the creating flag
    if (!selectedTaskId) {
      setIsCreatingNewTask(true);
    }
    
    // Add user message to current conversation
    const userMessage = { role: "user", message: input };
    updateCurrentState({
      messages: [...currentState.messages, userMessage]
    });
    
    const currentInput = input;
    setInput("");
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    try {
      let url: string;
      let body: any;

      // Convert selected tool IDs to backend tool names
      const backendToolNames = currentState.selectedTools.map(toolId => toolMappings[toolId as keyof typeof toolMappings]).filter(Boolean);

      if (selectedTaskId) {
        // Sending message to existing task - set it to processing
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTaskId 
              ? { ...task, status: 'processing' }
              : task
          )
        );

        url = `${API_BASE}/tasks/${selectedTaskId}/messages`;
        body = {
          message: currentInput,
          email: user,
          selected_tools: backendToolNames
        };
      } else {
        // Creating new task or continuing session
        url = `${API_BASE}/tasks`;
        if (currentSessionId) {
          url += `?session_id=${currentSessionId}`;
        }
        body = {
          message: currentInput,
          email: user,
          selected_tools: backendToolNames
        };
      }
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const data = await res.json();
      console.log("📧 Chat response:", data);
      
      if (selectedTaskId) {
        // For existing task, set messages from response
        updateCurrentState({
          messages: data.messages || [],
          loading: false,
          isSubmitting: false,
          error: null,
          lastFailedMessage: ""
        });
        
        // Emit task update event - task needs permission after AI responds
        emitTaskUpdate(selectedTaskId, 'needs_permission', 0);
      } else {
        // For new task, handle session creation
        let sessionId = currentSessionId;
        if (!currentSessionId && data.session_id) {
          sessionId = data.session_id;
          setCurrentSessionId(sessionId);
          if (sessionId) {
            localStorage.setItem('currentChatSessionId', sessionId);
          }
        }
        
        // Use the actual AI response from the backend
        let assistantResponse = "";
        if (data.response && data.response.trim()) {
          assistantResponse = data.response;
        } else if (data.messages && data.messages.length > 0) {
          // Find the last assistant message
          const lastAssistantMessage = data.messages
            .slice()
            .reverse()
            .find((msg: any) => msg.role === "assistant");
          assistantResponse = lastAssistantMessage?.message || "I'm ready to help you with your task!";
        } else {
          assistantResponse = "I'm ready to help you with your task!";
        }
        
        const assistantMessage = { role: "assistant", message: assistantResponse };
        const finalMessages = [...currentState.messages, userMessage, assistantMessage];
        
        // If we got a new session ID, transition from newChatState to taskStates
        if (sessionId && !currentSessionId && sessionId.trim() !== "") {
          // Ensure sessionId is treated as string for TypeScript
          const taskId: string = sessionId;
          
          // Move the conversation to the task-specific state
          setTaskStates(prev => ({
            ...prev,
            [taskId]: {
              messages: finalMessages,
              loading: false,
              isSubmitting: false,
              error: null,
              lastFailedMessage: "",
              selectedTools: currentState.selectedTools
            }
          }));
          
          // Switch to viewing the actual task
          setSelectedTaskId(taskId);
          
          // Clear the new chat state since we've moved to a real task
          setNewChatState({
            messages: [],
            loading: false,
            isSubmitting: false,
            error: null,
            lastFailedMessage: "",
            selectedTools: []
          });
          
          // Clear the creating new task flag
          setIsCreatingNewTask(false);
        } else {
          // Still in new chat state (continuing existing session)
          updateCurrentState({
            messages: finalMessages,
            loading: false,
            isSubmitting: false,
            error: null,
            lastFailedMessage: ""
          });
          
          // Clear the creating new task flag since we're done
          setIsCreatingNewTask(false);
        }
        
        // Emit task update event
        if (sessionId && data.status && typeof data.state === 'number') {
          emitTaskUpdate(sessionId, data.status, data.state);
        }
      }
      
    } catch (err: any) {
      console.error("❌ Error:", err);
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out. The server might be processing your request in the background.";
      } else if (err.message.includes('500')) {
        errorMessage = "Server error. Please try again in a moment.";
      } else if (err.message.includes('Network')) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      // Update error state for current conversation only
      updateCurrentState({
        loading: false,
        isSubmitting: false,
        error: errorMessage,
        lastFailedMessage: currentInput,
        // Remove the user message that was added optimistically
        messages: currentState.messages
      });
      
      // Clear the creating new task flag on error
      setIsCreatingNewTask(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);
    
    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const handleToolToggle = (toolId: string) => {
    const currentState = getCurrentState();
    const newSelectedTools = currentState.selectedTools.includes(toolId) 
      ? currentState.selectedTools.filter(id => id !== toolId)
      : [...currentState.selectedTools, toolId];
    
    updateCurrentState({ selectedTools: newSelectedTools });
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
  
  // Add this effect to auto-scroll
  const currentStateMessages = getCurrentState().messages;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentStateMessages]);

  const retryLastMessage = async () => {
    const currentState = getCurrentState();
    if (currentState.lastFailedMessage) {
      setInput(currentState.lastFailedMessage);
      updateCurrentState({ 
        lastFailedMessage: "",
        error: null 
      });
    }
  };

  // Group tasks by status
  const grouped = {
    processing: tasks.filter(t => t.status === "processing"),
    needs_permission: tasks.filter(t => t.status === "needs_permission"),
    complete: tasks.filter(t => t.status === "complete"),
  };

  // Get current conversation state for UI
  const currentState = getCurrentState();

  // Check if a task is currently processing (loading)
  const isTaskProcessing = (taskId: string) => {
    const taskState = taskStates[taskId];
    return taskState?.loading || taskState?.isSubmitting || false;
  };

  // Check if we're creating a new task (in new chat mode and processing)
  const isCreatingNewTaskVisible = isCreatingNewTask || (!selectedTaskId && (newChatState.loading || newChatState.isSubmitting));

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: "flex", 
        height: "calc(100vh - 80px)", // Account for header height
        width: "100%",
        position: "relative"
      }}
    >
      {/* Left Side - Task List */}
      <div style={{ 
        width: `${leftPanelWidth}%`,
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ 
          padding: "24px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0
        }}>
          <h2 style={{ margin: "0", fontSize: 20, fontWeight: 600 }}>My Tasks</h2>
          <button
            onClick={startNewChat}
            style={{
              padding: "8px 12px",
              background: "#374151",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#374151";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14m-7-7h14"/>
            </svg>
            Create New Task
          </button>
        </div>
        
        <div style={{ 
          flexGrow: 1,
          overflowY: "auto",
          padding: "20px"
        }}>
          {isTasksLoading ? (
            <div style={{ textAlign: "center", padding: 32, color: "#666" }}>
              <div style={{ fontSize: 16 }}>Loading tasks...</div>
            </div>
          ) : tasksError ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ color: "red", marginBottom: 16 }}>{tasksError}</div>
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
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#666" }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>No tasks yet</div>
              <div>Click "Create New Task" to get started!</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 24 }}>
              {/* Processing Tasks */}
              {(grouped.processing.length > 0 || isCreatingNewTaskVisible) && (
                <div>
                  <h3 style={{ 
                    margin: "0 0 16px 0", 
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 16
                  }}>
                    <div style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: "50%", 
                      background: "#2563eb",
                      animation: "pulse 2s infinite"
                    }}></div>
                    Processing ({grouped.processing.length + (isCreatingNewTaskVisible ? 1 : 0)})
                  </h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    {/* Show "Creating new task" item when creating a new task */}
                    {isCreatingNewTaskVisible && (
                      <div
                        style={{
                          padding: 16,
                          background: "#eff6ff",
                          border: "1px solid #2563eb",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          position: "relative",
                          opacity: 0.7
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                          Creating new task...
                        </div>
                        <div style={{ 
                          fontSize: 12, 
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
                          Processing...
                        </div>
                      </div>
                    )}
                    
                    {/* Existing processing tasks */}
                    {grouped.processing.map(task => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskSelect(task.id)}
                        style={{
                          padding: 16,
                          background: selectedTaskId === task.id ? "#eff6ff" : "#fff",
                          border: `1px solid ${selectedTaskId === task.id ? "#2563eb" : "#e5e7eb"}`,
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          position: "relative",
                          opacity: isTaskProcessing(task.id) ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTaskId !== task.id) {
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTaskId !== task.id) {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                          {task.title}
                        </div>
                        <div style={{ 
                          fontSize: 12, 
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
                          {isTaskProcessing(task.id) ? "Processing..." : statusLabels[task.status as keyof typeof statusLabels]}
                        </div>
                        {selectedTaskId === task.id && (
                          <div style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#2563eb"
                          }}></div>
                        )}
                        {isTaskProcessing(task.id) && (
                          <div style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            width: 12,
                            height: 12,
                            border: "2px solid #e2e8f0",
                            borderTopColor: "#2563eb",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                          }} />
                        )}
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
                    gap: 8,
                    fontSize: 16
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
                        onClick={() => handleTaskSelect(task.id)}
                        style={{
                          padding: 16,
                          background: selectedTaskId === task.id ? "#fef2f2" : "#fff",
                          border: `1px solid ${selectedTaskId === task.id ? "#dc2626" : "#e5e7eb"}`,
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          position: "relative",
                          opacity: isTaskProcessing(task.id) ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTaskId !== task.id) {
                            e.currentTarget.style.borderColor = "#dc2626";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTaskId !== task.id) {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                          {task.title}
                        </div>
                        <div style={{ 
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div style={{ 
                            fontSize: 12, 
                            color: "#dc2626",
                            fontWeight: 500
                          }}>
                            {isTaskProcessing(task.id) ? "Processing..." : statusLabels[task.status as keyof typeof statusLabels]}
                          </div>
                          <button
                            onClick={(e) => handleCompleteTask(task.id, e)}
                            style={{
                              padding: "4px 8px",
                              background: "#16a34a",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 10,
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
                            Complete
                          </button>
                        </div>
                        {selectedTaskId === task.id && (
                          <div style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#dc2626"
                          }}></div>
                        )}
                        {isTaskProcessing(task.id) && (
                          <div style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            width: 12,
                            height: 12,
                            border: "2px solid #e2e8f0",
                            borderTopColor: "#dc2626",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                          }} />
                        )}
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
                    gap: 8,
                    fontSize: 16
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
                        onClick={() => handleTaskSelect(task.id)}
                        style={{
                          padding: 16,
                          background: selectedTaskId === task.id ? "#f0fdf4" : "#f9fafb",
                          border: `1px solid ${selectedTaskId === task.id ? "#16a34a" : "#e5e7eb"}`,
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          opacity: selectedTaskId === task.id ? 1 : 0.8,
                          position: "relative"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTaskId !== task.id) {
                            e.currentTarget.style.borderColor = "#16a34a";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                            e.currentTarget.style.opacity = "1";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTaskId !== task.id) {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.opacity = "0.8";
                          }
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                          {task.title}
                        </div>
                        <div style={{ 
                          fontSize: 12, 
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
                        {selectedTaskId === task.id && (
                          <div style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#16a34a"
                          }}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: "8px",
          background: isDragging ? "#3b82f6" : "#e5e7eb",
          cursor: "col-resize",
          position: "relative",
          transition: isDragging ? "none" : "background-color 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = "#cbd5e1";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = "#e5e7eb";
          }
        }}
      >
        {/* Grip dots */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          opacity: 0.5
        }}>
          <div style={{
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "#6b7280"
          }}></div>
          <div style={{
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "#6b7280"
          }}></div>
          <div style={{
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "#6b7280"
          }}></div>
        </div>
      </div>

      {/* Right Side - Chat */}
      <div style={{ 
        width: `${100 - leftPanelWidth}%`,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Chat Header */}
        <div style={{ 
          padding: "24px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          flexShrink: 0
        }}>
          <h2 style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: "#1f2937", 
            margin: 0 
          }}>
            {selectedTaskId ? (
              <span>Task Conversation</span>
            ) : (
              <span>New Task Chat</span>
            )}
          </h2>
          <p style={{ 
            color: "#6b7280", 
            margin: "4px 0 0 0",
            fontSize: 14
          }}>
            {selectedTaskId ? (
              <span>Continue your conversation with this task</span>
            ) : (
              <span>Start a conversation to create a new task</span>
            )}
          </p>
        </div>

        {/* Messages Area */}
        <div style={{ 
          padding: "24px",
          flexGrow: 1,
          overflowY: "auto"
        }}>
          {currentState.messages.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              color: "#6b7280", 
              padding: "60px 20px"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {selectedTaskId ? "💬" : "🤖"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                {selectedTaskId ? "Task conversation" : "Ready to help!"}
              </div>
              <div style={{ fontSize: 14 }}>
                {selectedTaskId ? "Continue your conversation about this task" : "Select tools and start a conversation"}
              </div>
            </div>
          )}
          
          {currentState.messages.map((msg: any, idx: number) => (
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
          
          {currentState.loading && (
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
          
          {currentState.loading && (
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
          borderTop: "1px solid #e5e7eb",
          flexShrink: 0
        }}>
          {/* Error Display */}
          {currentState.error && (
            <div style={{ 
              color: "red", 
              marginBottom: 12,
              padding: "12px",
              background: "#fef2f2",
              borderRadius: 8,
              border: "1px solid #fecaca"
            }}>
              <div>{currentState.error}</div>
              {currentState.lastFailedMessage && (
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
            alignItems: "flex-end",
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
                disabled={currentState.loading}
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
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
                disabled={currentState.loading}
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
                {currentState.selectedTools.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 600
                  }}>
                    {currentState.selectedTools.length}
                  </div>
                )}
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
                    minWidth: 250,
                    maxWidth: 300,
                    overflow: "hidden"
                  }}
                >
                  <div style={{ 
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6"
                  }}>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search tools..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                        fontSize: 14,
                        background: "#fff",
                        outline: "none"
                      }}
                      autoFocus
                    />
                  </div>
                  <div style={{ 
                    maxHeight: "200px",
                    overflowY: "auto",
                    padding: "8px 0"
                  }}>
                    {filteredTools.length === 0 && (
                      <div style={{ padding: "12px 16px", color: "#6b7280", textAlign: "center", fontSize: 13 }}>
                        No tools found
                      </div>
                    )}
                    {filteredTools.map(tool => (
                      <div
                        key={tool.id}
                        onClick={() => handleToolToggle(tool.id)}
                        style={{
                          padding: "8px 16px",
                          cursor: "pointer",
                          fontSize: 13,
                          color: "#374151",
                          transition: "background-color 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: 12
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          border: "2px solid #e5e7eb",
                          borderRadius: 3,
                          background: currentState.selectedTools.includes(tool.id) ? "#38bdf8" : "#fff",
                          borderColor: currentState.selectedTools.includes(tool.id) ? "#38bdf8" : "#e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {currentState.selectedTools.includes(tool.id) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5-9-4z"/>
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: 14, marginRight: 8 }}>
                          {tool.id === 'gmail' ? '📧' : 
                           tool.id === 'calendar' ? '📅' : 
                           tool.id === 'websearch' ? '🔍' : '🛠️'}
                        </span>
                        <span style={{ fontWeight: 500 }}>
                          {tool.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  {currentState.selectedTools.length > 0 && (
                    <div style={{
                      padding: "8px 16px",
                      borderTop: "1px solid #f3f4f6",
                      background: "#f9fafb",
                      fontSize: 12,
                      color: "#6b7280"
                    }}>
                      {currentState.selectedTools.length} tool{currentState.selectedTools.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              )}
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
                maxHeight: "120px",
                overflow: "hidden",
                lineHeight: "1.5",
                fontFamily: "inherit"
              }}
              placeholder={currentState.loading ? "Waiting for response..." : "Ask anything"}
              disabled={false}
              rows={1}
            />
            
            {/* Send Button */}
            <button 
              type="submit" 
              style={{ 
                padding: "8px",
                borderRadius: 6,
                background: (input.trim() && !currentState.loading && !currentState.isSubmitting) ? "#222" : "#e5e7eb",
                color: (input.trim() && !currentState.loading && !currentState.isSubmitting) ? "#fff" : "#9ca3af",
                border: "none",
                cursor: (input.trim() && !currentState.loading && !currentState.isSubmitting) ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                marginLeft: 8
              }} 
              disabled={!input.trim() || currentState.loading || currentState.isSubmitting}
            >
              {currentState.loading ? (
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

      {/* CSS for animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Home; 