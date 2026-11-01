// frontend/src/pages/ATSChecker.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { FiUploadCloud, FiTrash2, FiDownload, FiCopy, FiCheck } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import api, { initAuthFromStorage, pingHealth } from "../api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Premium ATSChecker with:
 * - animated chips for matched/missing keywords
 * - downloadable PDF summary (capture report card)
 * - copyable suggestions + Apply Changes modal with examples
 *
 * Replace existing src/pages/ATSChecker.jsx with this file.
 */

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPT_MIME = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

function AnimatedDonut({ score = 0, size = 160 }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
      <div style={{ width: size, height: size }}>
        <CircularProgressbar
          value={value}
          text={`${value}%`}
          styles={buildStyles({
            textColor: "#312E81",
            pathColor: `url(#grad1)`,
            trailColor: "#E6E9FF",
            strokeLinecap: "round",
            textSize: "22px",
          })}
        />
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}

function Chip({ text, kind = "matched" }) {
  // kind: 'matched' or 'missing'
  const bg = kind === "matched" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
  return (
    <motion.span
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`px-3 py-1 rounded-full text-xs font-medium ${bg}`}
    >
      {text}
    </motion.span>
  );
}

export default function ATSChecker() {
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [serverOk, setServerOk] = useState(true);
  const [applyModal, setApplyModal] = useState({ open: false, suggestion: "" });
  const reportRef = useRef(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    initAuthFromStorage();
    (async () => {
      const ok = await pingHealth();
      setServerOk(!!ok);
      if (!ok) setError("Backend unreachable — check backend or VITE_API_URL.");
    })();
  }, []);

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError("");
    setResult(null);

    if (fileRejections && fileRejections.length > 0) {
      const msg = fileRejections[0].errors?.[0]?.message || "Invalid file";
      setError(msg);
      return;
    }
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    const f = acceptedFiles[0];
    if (f.size > MAX_SIZE) {
      setError("File too large (max 10 MB).");
      return;
    }
    setFile(f);
    setFileInfo({ name: f.name, size: f.size });
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPT_MIME,
    multiple: false,
    maxSize: MAX_SIZE,
  });

  const submit = async () => {
    setError("");
    setResult(null);
    setCopied(null);

    if (!serverOk) {
      setError("Backend unavailable. Start the backend server and retry.");
      return;
    }
    if (!file) {
      setError("Please upload a resume file (.pdf or .docx).");
      return;
    }

    const fd = new FormData();
    fd.append("resume", file);

    try {
      setLoading(true);
      const res = await api.post("/api/ats-check", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res?.data ?? {};
      const normalized = {
        ats_score: data.ats_score ?? data.score ?? 0,
        matched_keywords: data.matched_keywords ?? data.keywords_found ?? [],
        missing_keywords: data.missing_keywords ?? data.keywords_missing ?? [],
        suggestions: data.suggestions ?? [],
        breakdown: data.breakdown ?? {},
        meta: data.meta ?? {},
      };
      setResult(normalized);
    } catch (err) {
      console.error("ATS error:", err);
      if (err?.response) {
        const msg = err.response.data?.message || err.response.data?.error || `Server: ${err.response.status}`;
        setError(msg);
      } else if (err?.request) {
        setError("Network error: cannot reach server. Check backend or CORS.");
      } else {
        setError(err.message || "Unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setFileInfo(null);
    setResult(null);
    setError("");
    setCopied(null);
  };

  // ========== New: copy suggestion to clipboard ==========
  const copySuggestion = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(id);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  // ========== New: download report as PDF ==========
  const downloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      // capture the report card node as canvas
      const node = reportRef.current;
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, scrollY: -window.scrollY });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`resumeforge-ats-report-${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF export error", e);
      setError("Failed to create PDF. Try again.");
    }
  };

  // Apply changes modal content generator (example text)
  const generateApplyExample = (suggestion) => {
    // Simple heuristics: if suggestion mentions "Add keywords: X", create bullet to add under Skills
    if (!suggestion) return suggestion;
    const s = suggestion.toLowerCase();
    if (s.includes("add") && s.includes("keyword")) {
      // extract words after colon or 'add'
      const parts = suggestion.split(":");
      const kwList = parts.length > 1 ? parts[1] : suggestion;
      return `Example - Add to Skills section:\n\nSkills: ${kwList.trim()}\n\nExample - Incorporate in experience:\n• Improved system performance by X% using ${kwList.trim().split(",")[0].trim()} in project Y.`;
    }
    if (s.includes("add sections") || s.includes("add section")) {
      return "Example - Sections to add:\n\nSummary\nSkills\nExperience\nEducation\nProjects\n\nAdd a short 2-3 line summary at the top highlighting your role and key skills.";
    }
    if (s.toLowerCase().includes("quantifiable") || s.toLowerCase().includes("numbers")) {
      return "Example - Make bullets quantifiable:\n\n• Increased revenue by 28% (₹X) by optimizing the checkout flow.\n• Reduced API latency by 42% using caching and query optimization.";
    }
    // fallback copy
    return `Suggestion example:\n\n${suggestion}\n\nTry to incorporate this into a Skills or Experience bullet with metrics.`;
  };

  // reorder metric keys for display
  const metricOrder = [
    "parse_rate",
    "keywords",
    "impact",
    "readability",
    "repetition",
    "sections",
    "formatting",
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg,#eef2ff 0%, #e6f0ff 50%, #eaf9ff 100%)" }}>
      {/* floating soft blobs */}
      <motion.div className="absolute -left-20 -top-10 w-72 h-72 rounded-full blur-3xl bg-indigo-300/30" animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 10 }} />
      <motion.div className="absolute -right-28 bottom-8 w-96 h-96 rounded-full blur-3xl bg-sky-300/30" animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 12 }} />
      <motion.div className="absolute left-1/2 -translate-x-1/2 top-24 w-96 h-96 rounded-full blur-2xl bg-indigo-200/20" animate={{ x: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 18 }} />

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <motion.h1 initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl md:text-5xl font-extrabold text-indigo-900 text-center mb-8">
          ResumeForge — <span className="text-sky-600">ATS Checker</span>
        </motion.h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* left: upload card */}
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="p-6 rounded-2xl bg-white/40 backdrop-blur-lg border border-white/60 shadow-lg">
            <div {...getRootProps()} className={`rounded-xl p-6 border-2 border-dashed cursor-pointer transition ${isDragActive ? "border-sky-400 bg-sky-50/60" : "border-indigo-200 bg-white/30"}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-full bg-white/60 shadow-inner">
                  <FiUploadCloud className="text-4xl text-indigo-700" />
                </div>
                <div className="text-lg font-medium text-indigo-800">{isDragActive ? "Release to upload" : "Drag & drop your resume or click to browse"}</div>
                <div className="text-xs text-indigo-600">Accepted: .pdf, .docx, .txt — max 10 MB</div>
                {fileInfo && <div className="mt-2 text-emerald-700 text-sm font-medium">{fileInfo.name} — {(fileInfo.size / (1024 * 1024)).toFixed(2)} MB</div>}
                {fileRejections?.length > 0 && <div className="mt-2 text-rose-600 text-sm">{fileRejections[0].errors?.[0]?.message}</div>}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={submit} disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">
                {loading ? "Analyzing..." : "Check ATS Score"}
              </button>

              <button onClick={reset} className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-white/60">
                <FiTrash2 /> Reset
              </button>

              <button onClick={downloadPDF} className="ml-auto px-3 py-2 bg-white/80 rounded-lg flex items-center gap-2 text-indigo-700 hover:brightness-95">
                <FiDownload /> Export PDF
              </button>
            </div>

            {error && <div className="mt-4 text-sm text-rose-600">{error}</div>}
            <div className="mt-4 text-xs text-indigo-700">Tip: Single-column, text-first resumes work best with ATS systems.</div>
          </motion.div>

          {/* right: result card */}
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="p-6 rounded-2xl bg-white/40 backdrop-blur-lg border border-white/60 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              {/* report ref — used for PDF export */}
              <div ref={reportRef} className="w-full p-3 rounded-lg bg-white/90">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-indigo-900 font-semibold">ATS Score</div>
                    <div className="text-xs text-indigo-600">Overall match & resume quality</div>
                  </div>
                  <div style={{ width: 120, height: 120 }}>
                    <CircularProgressbar
                      value={result?.ats_score ?? 0}
                      text={`${result?.ats_score ?? 0}%`}
                      styles={buildStyles({
                        textColor: "#312E81",
                        pathColor: "#6366f1",
                        trailColor: "#E6E9FF",
                      })}
                    />
                  </div>
                </div>

                {/* chips: matched / missing */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-indigo-700 font-semibold mb-2">Matched</div>
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {(result?.matched_keywords ?? []).length ? result.matched_keywords.map((k) => (
                          <ChipAnim key={k} text={k} kind="matched" />
                        )) : <div className="text-xs text-indigo-500">None</div>}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-indigo-700 font-semibold mb-2">Missing</div>
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {(result?.missing_keywords ?? []).length ? result.missing_keywords.map((k) => (
                          <ChipAnim key={k} text={k} kind="missing" />
                        )) : <div className="text-xs text-indigo-500">None</div>}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* metrics */}
                <div className="space-y-3">
                  {result?.breakdown ? (
                    metricOrder.map((k) => {
                      const comp = result.breakdown[k];
                      if (!comp) return null;
                      return (
                        <div key={k}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm font-medium text-indigo-800 capitalize">{k.replace(/_/g, " ")}</div>
                            <div className="text-sm font-semibold text-indigo-700">{comp.score}%</div>
                          </div>
                          <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                            <div style={{ width: `${comp.score}%`, background: "linear-gradient(90deg,#6366f1,#06b6d4)", height: 8 }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-indigo-700">Upload a resume and click <span className="font-semibold">Check ATS Score</span> to see a full report.</div>
                  )}
                </div>
              </div>

              {/* suggestions + controls */}
              <div className="w-full mt-3 p-3 rounded-lg bg-white/90 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaRobot className="text-sky-600" />
                    <div className="text-sm font-semibold text-indigo-800">AI Suggestions</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => { if(result) downloadPDF(); }} className="px-3 py-1 text-xs rounded-md bg-indigo-50 border">Save PDF</button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(result?.suggestions && result.suggestions.length) ? result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-1 text-sm text-indigo-900">{s}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copySuggestion(s, `s-${i}`)}
                          className="p-2 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                          title="Copy suggestion"
                        >
                          {copied === `s-${i}` ? <FiCheck /> : <FiCopy />}
                        </button>
                        <button
                          onClick={() => setApplyModal({ open: true, suggestion: s })}
                          className="p-2 rounded-md bg-sky-50 text-sky-600"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-xs text-indigo-700">Suggestions will appear here after analysis.</div>
                  )}
                </div>
              </div>

              {/* meta */}
              {result?.meta && (
                <div className="mt-3 text-xs text-indigo-700">
                  Words: {result.meta.word_count ?? "-"} • Readability: {Math.round(result.meta.readability ?? 0)} • Images: {result.meta.images ?? 0}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Apply changes modal */}
      <AnimatePresence>
        {applyModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setApplyModal({ open: false, suggestion: "" })} />
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="relative z-50 w-full max-w-2xl p-6 rounded-xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-indigo-900">Apply suggestion</h3>
                  <p className="text-sm text-indigo-700 mt-1">Example text & tips to apply this suggestion to your resume.</p>
                </div>
                <button onClick={() => setApplyModal({ open: false, suggestion: "" })} className="text-indigo-600">Close</button>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-indigo-800 mb-2">Suggestion</div>
                <div className="p-3 rounded-md bg-indigo-50 text-indigo-900">{applyModal.suggestion}</div>

                <div className="mt-4 text-sm text-indigo-800 font-medium">Example / Template</div>
                <textarea
                  readOnly
                  value={generateApplyExample(applyModal.suggestion)}
                  className="w-full mt-2 p-3 rounded-md bg-gray-50 border h-36"
                />

                <div className="mt-4 flex gap-3">
                  <button onClick={() => copySuggestion(generateApplyExample(applyModal.suggestion), "apply-example")} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                    Copy Example
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(applyModal.suggestion); setCopied("apply-sugg"); setTimeout(()=>setCopied(null),2000); }} className="px-4 py-2 border rounded-md">
                    Copy Suggestion {copied === "apply-sugg" && <span className="ml-2 text-emerald-600">✓</span>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* footer overlay */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
    </div>
  );
}

/* Animated Chip component defined outside so AnimatePresence works */
function ChipAnim({ text, kind }) {
  const bg = kind === "matched" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
  return (
    <motion.span
      layout
      initial={{ opacity: 0, y: -6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`px-3 py-1 rounded-full text-xs font-medium ${bg}`}
    >
      {text}
    </motion.span>
  );
}
