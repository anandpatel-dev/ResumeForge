// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setAuthToken(savedToken); // Set token globally
    }
  }, []);

const login = async (email, password) => {
  const res = await api.post("/api/login", { email, password });
  if (res.data.success) {
    setUser(res.data.user);
    setAuthToken(res.data.token); // yaha pe token ka correct naam
    localStorage.setItem("user", JSON.stringify(res.data.user));
    localStorage.setItem("token", res.data.token); // yaha bhi token
    navigate("/dashboard");
  } else {
    throw new Error(res.data.message || "Login failed");
  }
};


  const signup = async (name, email, password) => {
    const res = await api.post("/api/signup", { name, email, password });
    if (res.data.success) {
      await login(email, password); // Auto login
    } else {
      throw new Error(res.data.message || "Signup failed");
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
