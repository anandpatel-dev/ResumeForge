// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import { LightBulbIcon, RocketLaunchIcon, UsersIcon } from "@heroicons/react/24/outline";

export default function About() {
  const features = [
    {
      icon: LightBulbIcon,
      title: "Our Mission",
      desc: "To empower job seekers with AI-driven tools for crafting winning resumes and improving ATS compatibility.",
    },
    {
      icon: RocketLaunchIcon,
      title: "Our Vision",
      desc: "Become the go-to platform for AI-powered career growth solutions worldwide.",
    },
    {
      icon: UsersIcon,
      title: "Our Team",
      desc: "A passionate group of developers, designers, and AI enthusiasts working to make career advancement easy.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-indigo-700 mb-6">About ResumeForge</h1>
        <p className="text-gray-600 mb-8">
          ResumeForge is an AI-powered platform designed to help job seekers improve their resumes, match job descriptions, and get career guidance — all in one place.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="p-5 bg-indigo-50 rounded-lg shadow hover:shadow-md transition"
              whileHover={{ scale: 1.02 }}
            >
              <f.icon className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
