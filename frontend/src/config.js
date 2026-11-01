// src/config.js
const dev = {
  API_BASE: "http://127.0.0.1:5000", // local Flask
};

const prod = {
  API_BASE: "https://api.resumeforge.com", // future production backend
};

export const config = import.meta.env.MODE === "development" ? dev : prod;

export const API_BASE = config.API_BASE;

// agar auth headers lagane hain
export const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
