// src/pages/ResumeDownload.jsx
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeftIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import api from "../api";
import { useResume } from "../context/ResumeContext";

export default function ResumeDownload() {
  const navigate = useNavigate();
  const { data, selectedTemplate, selectedTheme } = useResume();

  const engine = selectedTheme ? "jsonresume" : "html";

  const download = async (format = "pdf") => {
    try {
      const body =
        engine === "html"
          ? {
              engine,
              template_id: selectedTemplate?.id || 1,
              data,
            }
          : {
              engine,
              theme_name: selectedTheme?.theme_name || "elegant",
              data,
            };

      const res = await api.post("/resume/download", body, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume.${format}`);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      console.error("Download failed", e);
      alert("Download failed, please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-100 px-6 py-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full bg-white/80 backdrop-blur-lg border rounded-2xl shadow-xl p-10 text-center"
      >
        {/* Success Icon */}
        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto animate-bounce" />
        <h1 className="text-3xl font-bold text-gray-800 mt-4">
          🎉 Your Resume is Ready!
        </h1>
        <p className="text-gray-500 mt-2">
          Download your professional resume in multiple formats.
        </p>

        {/* Preview Placeholder */}
        <div className="mt-8 flex justify-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-64 h-80 border rounded-xl shadow-lg overflow-hidden bg-gray-50 flex items-center justify-center text-gray-400"
          >
            Resume Preview
          </motion.div>
        </div>

        {/* Download Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => download("pdf")}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition"
          >
            Download PDF
          </button>
          <button
            onClick={() => download("docx")}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition"
          >
            Download DOCX
          </button>
          <button
            onClick={() => download("txt")}
            className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-md transition"
          >
            Download TXT
          </button>
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <button
            onClick={() => navigate("/dashboard/resume/editor")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-sm transition"
          >
            <ArrowLeftIcon className="w-5 h-5" /> Back to Editor
          </button>
          <button
            onClick={() => navigate("/dashboard/resume/templates")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-md transition"
          >
            <ArrowPathIcon className="w-5 h-5" /> Start New Resume
          </button>
        </div>
      </motion.div>
    </div>
  );
}
