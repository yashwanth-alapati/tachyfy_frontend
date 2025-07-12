import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./Chat";
import Header from "./Header";
import Login from "./Login";
import Signup from "./Signup";
import TaskList from "./TaskList";
import TaskChat from "./TaskChat";
import Profile from "./Profile";
import { AuthProvider } from "./AuthContext";
import { NotificationProvider } from "./NotificationContext";
import GlobalNotifications from "./components/GlobalNotifications";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div style={{ minHeight: "100vh", position: "relative" }}>
            <Header />
            <GlobalNotifications />
            <Routes>
              <Route path="/" element={<Chat />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/tasks/:id" element={<TaskChat />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;