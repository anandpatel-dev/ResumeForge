import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

export default function AICareerAssistant() {
  const [messages, setMessages] = useState([
    { from: "ai", text: "✨ Hi! I'm your AI Career Assistant. Ask me anything about resumes, jobs, or interviews!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setListening(false);
      };

      recognitionRef.current.onend = () => setListening(false);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages([...messages, { from: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/ai_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: data.reply || "⚠️ No response from AI" },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "❌ Error connecting to AI backend." },
      ]);
    }
    setLoading(false);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in your browser.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* Header */}
      <div className="p-4 bg-black/30 shadow-lg flex items-center justify-between backdrop-blur-md border-b border-white/20">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-yellow-400 animate-pulse" />
          AI Career Assistant
        </h1>
        <span className="text-sm text-gray-300">Chat • Voice Enabled</span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl max-w-xs md:max-w-md relative ${
                msg.from === "user"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                  : "bg-white/10 backdrop-blur-md text-gray-100 border border-white/20 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/20 animate-pulse text-gray-300">
              Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef}></div>
      </div>

      {/* Input area */}
      <div className="p-4 bg-black/30 border-t border-white/20 flex items-center space-x-3 backdrop-blur-md">
        <button
          onClick={handleVoiceInput}
          className={`p-3 rounded-full shadow-lg transition ${
            listening
              ? "bg-red-500 animate-pulse"
              : "bg-pink-600 hover:bg-pink-700"
          }`}
          title="Voice Input"
        >
          <MicrophoneIcon className="h-6 w-6 text-white" />
        </button>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border border-white/20 rounded-full px-4 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button
          onClick={handleSend}
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition"
        >
          <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
        </button>
      </div>
    </div>
  );
}
