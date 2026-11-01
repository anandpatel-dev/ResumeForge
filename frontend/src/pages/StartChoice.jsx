// src/pages/StartChoice.jsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useResume } from "../context/ResumeContext";
import { CloudArrowUpIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function StartChoice() {
  const navigate = useNavigate();
  const { selectedTemplate, selectedTheme, setData } = useResume();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (!selectedTemplate && !selectedTheme) {
      // optional toast/info
    }
  }, [selectedTemplate, selectedTheme]);

  const onUpload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return alert("Choose a file first (.pdf/.docx/.txt)");

    const form = new FormData();
    form.append("file", f);

    try {
      setUploading(true);
      const res = await api.post("/resume/upload-parse", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        setData((prev) => ({ ...prev, ...res.data.data }));
        navigate("/dashboard/resume/editor");
      } else {
        alert(res.data?.message || "Parse failed");
      }
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full"
      >
        {/* Start New */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-gradient-to-br from-indigo-50 to-white border rounded-2xl shadow-lg p-7"
        >
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-indigo-600" />
            <h2 className="text-xl font-bold">✨ Start New Resume</h2>
          </div>
          <p className="text-gray-500 mt-2">
            Begin with a clean template and fill details step by step.
          </p>

          {!selectedTemplate && !selectedTheme && (
            <p className="mt-3 text-sm text-amber-600">
              * You haven’t selected a template yet. We’ll take you to the template gallery first.
            </p>
          )}

          <button
            onClick={() =>
              selectedTemplate || selectedTheme
                ? navigate("/dashboard/resume/builder/step/1")
                : navigate("/dashboard/resume/templates")
            }
            className="mt-6 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition"
          >
            {selectedTemplate || selectedTheme ? "Create New" : "Choose a Template"}
          </button>
        </motion.div>

        {/* Upload Existing */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-gradient-to-br from-green-50 to-white border rounded-2xl shadow-lg p-7"
        >
          <div className="flex items-center gap-2">
            <CloudArrowUpIcon className="w-7 h-7 text-green-600" />
            <h2 className="text-xl font-bold">📄 Upload Existing</h2>
          </div>
          <p className="text-gray-500 mt-2">
            Upload a resume file (.pdf, .docx, .txt) and edit instantly.
          </p>

          <div className="mt-5">
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm">Click or Drag file here</span>
            </label>
          </div>

          <button
            disabled={uploading}
            onClick={onUpload}
            className="mt-6 px-5 py-2 bg-green-600 disabled:opacity-60 text-white rounded-lg hover:bg-green-700 shadow-md transition flex items-center justify-center"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                Uploading…
              </span>
            ) : (
              "Upload & Continue"
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
