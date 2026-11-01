// frontend/src/api.js
import axios from "axios";

const DEFAULT_BASE = import.meta.env.VITE_API_URL || "";

// axios instance
const api = axios.create({
  baseURL: DEFAULT_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Auth Helpers ----

// set/remove Authorization header
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("rf_token", token); // ✅ persist
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("rf_token");
  }
};

// read token from storage and set header
export const initAuthFromStorage = () => {
  try {
    const token =
      localStorage.getItem("rf_token") ||
      localStorage.getItem("token") ||
      null;
    if (token) setAuthToken(token);
    return token;
  } catch (e) {
    console.warn("Auth init failed:", e);
    return null;
  }
};

// ---- Auth API ----

export const loginUser = async (email, password) => {
  const res = await api.post("/api/login", { email, password });
  if (res?.data?.token) setAuthToken(res.data.token);
  return res.data;
};

export const signupUser = async (email, password) => {
  const res = await api.post("/api/signup", { email, password });
  return res.data;
};

export const logoutUser = () => {
  setAuthToken(null);
};

// ---- Utilities ----

export const pingHealth = async () => {
  try {
    const res = await api.get("/api/health");

    return (
      res?.data?.ok === true ||
      res?.data?.status === "ok"
    );
  } catch (e) {
    console.error("Health check failed:", e.message);
    return false;
  }
};

// ---- AI Chatbot Helpers ----

export const sendAIMessage = async (message, history = []) => {
  const res = await api.post("/api/ai/chat", { message, history });
  return res?.data; // { reply: "...", suggestions: [...] }
};

export const sendAIVoice = async (audioBlob) => {
  const formData = new FormData();
  formData.append("file", audioBlob, "voice-input.wav");

  const res = await api.post("/api/ai/voice", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res?.data; // { reply: "...", transcript: "..." }
};

export const getAITTS = async (text) => {
  const res = await api.post(
    "/api/ai/tts",
    { text },
    { responseType: "blob" }
  );
  return URL.createObjectURL(res.data); // blob URL for <audio src=...>
};

// ---- Global Interceptor ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("⚠️ Unauthorized: clearing token");
      setAuthToken(null);
      // Optional: redirect to login
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
