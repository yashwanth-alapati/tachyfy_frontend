import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Login from "./Login";
import Signup from "./Signup";
import Profile from "./Profile";
import { AuthProvider } from "./AuthContext";
import { NotificationProvider } from "./NotificationContext";
import GlobalNotifications from "./components/GlobalNotifications";
import Home from "./Home";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div style={{ minHeight: "100vh", position: "relative" }}>
            <Header />
            <GlobalNotifications />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;