// src/pages/ResumeEditor.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import { useResume } from "../context/ResumeContext";
import ResumePreview from "../components/resume/ResumePreview";

export default function ResumeEditor() {
  const { data, selectedTemplate, selectedTheme } = useResume();
  const [previewHtml, setPreviewHtml] = useState("");
  const [rendering, setRendering] = useState(false);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState("base");
  const [lineHeight, setLineHeight] = useState("normal");
  const [color, setColor] = useState("indigo");
  const navigate = useNavigate();

  const engine = selectedTheme ? "jsonresume" : "html";

  const renderPreview = async () => {
    try {
      setRendering(true);
      const body =
        engine === "html"
          ? {
              engine,
              template_id: selectedTemplate?.id || 1,
              data: { ...data, meta: { fontFamily, fontSize, lineHeight, color } },
            }
          : {
              engine,
              theme_name: selectedTheme?.theme_name || "elegant",
              data: { ...data, meta: { fontFamily, fontSize, lineHeight, color } },
            };
      const res = await api.post("/resume/render", body);
      setPreviewHtml(res.data?.html || "");
    } catch (e) {
      console.error("Preview render failed", e);
    } finally {
      setRendering(false);
    }
  };

  useEffect(() => {
    renderPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontFamily, fontSize, lineHeight, color, selectedTemplate, selectedTheme]);

  const downloadPdf = async () => {
    try {
      const body =
        engine === "html"
          ? {
              engine,
              template_id: selectedTemplate?.id || 1,
              data: { ...data, meta: { fontFamily, fontSize, lineHeight, color } },
            }
          : {
              engine,
              theme_name: selectedTheme?.theme_name || "elegant",
              data: { ...data, meta: { fontFamily, fontSize, lineHeight, color } },
            };
      const res = await api.post("/resume/download", body, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "resume.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      console.error("Download failed", e);
      alert("Download failed");
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Toolbar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between bg-white border-b px-4 py-3 shadow sticky top-0 z-20"
      >
        <div className="flex gap-4 items-center">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Merriweather">Merriweather</option>
            <option value="Georgia">Georgia</option>
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="sm">Small</option>
            <option value="base">Normal</option>
            <option value="lg">Large</option>
          </select>
          <select
            value={lineHeight}
            onChange={(e) => setLineHeight(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="tight">Tight</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Relaxed</option>
          </select>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="indigo">Indigo</option>
            <option value="blue">Blue</option>
            <option value="emerald">Green</option>
            <option value="rose">Red</option>
            <option value="amber">Yellow</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={renderPreview}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            {rendering ? "Rendering…" : "Refresh"}
          </button>
          <button
            onClick={downloadPdf}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Download PDF
          </button>
          <button
            onClick={() => navigate("/dashboard/resume/templates")}
            className="px-3 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
          >
            Change Template
          </button>
        </div>
      </motion.div>

      {/* Live Preview */}
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto bg-white shadow-lg border rounded-2xl overflow-hidden"
        >
          <ResumePreview html={previewHtml} />
        </motion.div>
      </div>
    </div>
  );
}
