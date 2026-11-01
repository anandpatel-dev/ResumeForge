import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  // Dummy stats
  const stats = [
    { title: "Uploaded resumes", value: 24 },
    { title: "Average ATS score", value: "68%" },
    { title: "Suggestions generated", value: 127 },
  ];

  // Feature cards
  const features = [
    {
      title: "ATS Score Checker",
      description: "Upload your resume and get ATS compatibility score & keyword analysis.",
      icon: <ClipboardDocumentCheckIcon className="h-10 w-10 text-indigo-600" />,
      link: "/dashboard/ats",
    },
    {
      title: "JD Matcher",
      description: "Match your resume with job descriptions & see missing skills.",
      icon: <MagnifyingGlassIcon className="h-10 w-10 text-indigo-600" />,
      link: "/dashboard/jd-matcher",
    },
   {

  title: "Resume Builder",
  description: "Build, edit & customize resumes with live preview and one-click PDF export.",
  icon: <SparklesIcon className="h-10 w-10 text-violet-500 animate-pulse" />,
  link: "/dashboard/resume",   // 🔥 Corrected
},


    {
      title: "AI Career Assistant",
      description: "Get AI-powered career guidance & resume improvement suggestions.",
      icon: <ChatBubbleLeftRightIcon className="h-10 w-10 text-indigo-600" />,
      link: "/dashboard/career-assistant",
    },
  ];

  // Extra details
  const details = [
    {
      title: "50+ Templates",
      desc: "Choose from modern, professional, and creative designs.",
    },
    {
      title: "1-Click Export",
      desc: "Download in PDF, DOCX, or share via link instantly.",
    },
    {
      title: "AI Suggestions",
      desc: "Get real-time tips to optimize your resume content.",
    },
  ];

  return (
    <div className="p-6 space-y-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      {/* Top Heading */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome to ResumeForge</h1>
        <p className="text-gray-500">Select a tool to get started</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-indigo-300 hover:scale-105 transition-all duration-300"
          >
            <p className="text-gray-500 text-sm">{stat.title}</p>
            <p className="text-3xl font-bold text-indigo-700 mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Feature Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 hover:shadow-indigo-400 hover:border-indigo-300 transition-all duration-300"
          >
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="flex items-center justify-center h-16 w-16 bg-indigo-100 rounded-full mx-auto mb-4"
            >
              {feature.icon}
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-800 text-center">{feature.title}</h3>
            <p className="text-gray-500 text-sm text-center mt-2">{feature.description}</p>
            <div className="flex justify-center mt-4">
              <Link
                to={feature.link}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
              >
                Open
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Extra Details Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Why Choose ResumeForge?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {details.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.2 }}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 text-center"
            >
              <h3 className="text-lg font-semibold text-indigo-600">{d.title}</h3>
              <p className="text-gray-500 text-sm mt-2">{d.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 