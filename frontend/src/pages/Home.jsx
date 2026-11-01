// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    id: "ats",
    title: "ATS Score Checker",
    desc: "Upload resume and get a detailed, actionable ATS report.",
    href: "/ats"
  },
  {
    id: "jd",
    title: "JD Matcher",
    desc: "Compare resume with job descriptions and highlight gaps.",
    href: "/jd-matcher"
  },
  {
    id: "builder",
    title: "Resume Builder",
    desc: "Build from templates with section-wise suggestions and PDF export.",
    href: "/builder"
  },
  {
    id: "ai",
    title: "AI Career Assistant",
    desc: "AI-powered wording, skills recommendations and career tips.",
    href: "/ai"
  },
];

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Quick access to the core ResumeForge tools.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <article key={f.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
              <div aria-hidden className="text-3xl opacity-20 group-hover:opacity-30">⋯</div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link to={f.href} className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-sm shadow-sm">Open</Link>
              <div className="text-xs text-slate-400">Quick open</div>
            </div>
          </article>
        ))}
      </div>

      {/* small stats */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm text-slate-500">Uploaded resumes</div>
          <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">24</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm text-slate-500">Average ATS score</div>
          <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">68%</div>
        </div>
      </div>
    </div>
  );
}
