import React from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">ResumeForge</h1>
        <ul className="flex space-x-6">
          <li><a href="#" className="hover:text-blue-400">Home</a></li>
          <li><a href="#features" className="hover:text-blue-400">Features</a></li>
          <li><a href="#contact" className="hover:text-blue-400">Contact</a></li>
          <li><a href="/login" className="hover:text-blue-400">Login</a></li>
          <li><a href="/signup" className="hover:text-blue-400">Signup</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white text-center py-20">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Smart Resumes. Instant ATS Score.
        </h2>
        <p className="text-lg mb-6">
          Build professional resumes with AI-powered suggestions.
        </p>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded shadow">
          Start Building
        </button>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-100 py-16 flex-1">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">Resume Builder</h3>
            <p className="text-gray-600">
              Create and export resumes in modern formats.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">ATS Score Checker</h3>
            <p className="text-gray-600">
              Match resumes with job descriptions using AI.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Suggestions</h3>
            <p className="text-gray-600">
              Enhance resume sections with smart guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-4">
        © 2025 ResumeForge | All rights reserved.
      </footer>
    </div>
  );
}
