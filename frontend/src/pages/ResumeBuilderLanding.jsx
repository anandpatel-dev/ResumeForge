// src/pages/ResumeBuilderLanding.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  SparklesIcon,
  ArrowRightCircleIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function ResumeBuilderLanding() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-6 py-16">
      {/* Decorative background orbs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-5xl w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-12"
      >
        {/* Header */}
        <div className="text-center mb-14">
          <SparklesIcon className="w-16 h-16 text-indigo-600 mx-auto animate-bounce drop-shadow-lg" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mt-6">
            Build Your Resume <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Like a Pro</span>
          </h1>
          <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
            Choose from stunning templates or upload your existing resume. Get a polished, ATS-friendly resume in minutes ✨
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Create New Resume */}
          <motion.div
            whileHover={{ scale: 1.05, y: -6 }}
            className="group relative p-8 rounded-2xl border border-transparent bg-gradient-to-br from-indigo-50/60 to-white/50 backdrop-blur-md shadow-lg hover:shadow-indigo-300/40 transition"
          >
            {/* Glow Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 blur-xl transition duration-500" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <ArrowRightCircleIcon className="w-16 h-16 text-indigo-600 mb-5" />
              <h2 className="text-2xl font-bold text-gray-800">
                Create New Resume
              </h2>
              <p className="text-gray-600 mt-3 text-base">
                Explore 50+ professional templates and start fresh with step-by-step guidance.
              </p>
              <Link
                to="/dashboard/resume/templates"
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl shadow-md text-sm font-medium hover:scale-105 hover:shadow-lg transition-all"
              >
                Choose Template →
              </Link>
            </div>
          </motion.div>

          {/* Optimize Old Resume */}
          <motion.div
            whileHover={{ scale: 1.05, y: -6 }}
            className="group relative p-8 rounded-2xl border border-transparent bg-gradient-to-br from-purple-50/60 to-white/50 backdrop-blur-md shadow-lg hover:shadow-purple-300/40 transition"
          >
            {/* Glow Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition duration-500" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <DocumentArrowUpIcon className="w-16 h-16 text-purple-600 mb-5" />
              <h2 className="text-2xl font-bold text-gray-800">
                Optimize Existing Resume
              </h2>
              <p className="text-gray-600 mt-3 text-base">
                Upload your old resume (PDF, DOCX, TXT) and instantly enhance it with AI-powered suggestions.
              </p>
              <Link
                to="/dashboard/resume/start"
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow-md text-sm font-medium hover:scale-105 hover:shadow-lg transition-all"
              >
                Upload & Improve →
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
