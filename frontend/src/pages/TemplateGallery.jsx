// src/pages/TemplateGallery.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume } from "../context/ResumeContext";
import { SparklesIcon } from "@heroicons/react/24/solid";

const templates = [
  { id: 1, name: "Clean", img: "/thumbnails/clean.png", color: "blue", layout: "Simple" },
  { id: 2, name: "Modern", img: "/thumbnails/modern.png", color: "indigo", layout: "Professional" },
  { id: 3, name: "Elegant", img: "/thumbnails/elegant.png", color: "pink", layout: "Creative" },
];

const filters = ["All", "Simple", "Professional", "Creative"];

export default function TemplateGallery() {
  const [activeFilter, setActiveFilter] = useState("All");
  const { setSelectedTemplate } = useResume();
  const navigate = useNavigate();

  const filtered = activeFilter === "All"
    ? templates
    : templates.filter((t) => t.layout === activeFilter);

  const onChoose = (tpl) => {
    setSelectedTemplate(tpl);
    navigate("/dashboard/resume/start");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <SparklesIcon className="w-14 h-14 text-indigo-600 mx-auto animate-bounce" />
        <h1 className="text-3xl font-bold text-gray-800 mt-4">
          Choose Your Perfect Resume Template
        </h1>
        <p className="text-gray-500 mt-2">
          Professionally designed templates for every career stage
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all
              ${activeFilter === f
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-300"
                : "bg-white border border-gray-200 hover:bg-gray-50"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {filtered.map((template, i) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="group bg-white/60 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-lg hover:shadow-indigo-200 overflow-hidden"
          >
            <div className="relative">
              <img
                src={template.img}
                alt={template.name}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
            </div>

            <div className="p-5 flex flex-col justify-between h-40">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-1 rounded-full 
                    ${template.color === "blue" ? "bg-blue-100 text-blue-700" :
                      template.color === "indigo" ? "bg-indigo-100 text-indigo-700" :
                      template.color === "pink" ? "bg-pink-100 text-pink-700" :
                      "bg-gray-100 text-gray-600"}`}
                >
                  {template.layout}
                </span>
              </div>
              <button
                onClick={() => onChoose(template)}
                className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow hover:shadow-lg transition"
              >
                Use Template
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
