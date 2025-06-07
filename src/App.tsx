import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./Chat";
import Header from "./Header";
import Login from "./Login";
import Signup from "./Signup";

function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", position: "relative" }}>
        <Header />
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;