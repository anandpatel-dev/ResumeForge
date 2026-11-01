// frontend/src/pages/JDMatcher.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { FiUploadCloud, FiTrash2, FiDownload, FiCopy, FiCheck, FiSave, FiList } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import api, { initAuthFromStorage, pingHealth } from "../api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Final JDMatcher with:
 * - save result to backend /api/results (JWT if present)
 * - pretty two-column PDF export (client-side using jsPDF)
 * - history button (navigate to /history)
 * - keyboard shortcut Ctrl/Cmd+Enter to analyze
 */

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT_MIME = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

function AnimatedDonut({ value = 0, size = 140, label = "Score" }) {
  const val = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
      <div style={{ width: size, height: size }}>
        <CircularProgressbar
          value={val}
          text={`${val}%`}
          styles={buildStyles({
            textColor: "#0f172a",
            pathColor: "#6366f1",
            trailColor: "#E6E9FF",
            strokeLinecap: "round",
            textSize: "20px",
          })}
        />
      </div>
      <div className="text-sm text-center text-slate-700 mt-2">{label}</div>
    </motion.div>
  );
}

function ChipAnim({ text, kind = "matched" }) {
  const bg = kind === "matched" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";
  return (
    <motion.span
      layout
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`px-3 py-1 rounded-full text-xs font-medium ${bg}`}
    >
      {text}
    </motion.span>
  );
}

export default function JDMatcher({ navigateToHistory = "/dashboard/history" }) {

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverOk, setServerOk] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [applyModal, setApplyModal] = useState({ open: false, suggestion: "" });
  const reportRef = useRef(null);

  useEffect(() => {
    initAuthFromStorage();
    (async () => {
      const ok = await pingHealth();
      setServerOk(!!ok);
      if (!ok) setError("Backend unreachable — check VITE_API_URL and start backend.");
    })();
  }, []);

  // Dropzones
  const onDropResume = useCallback((acceptedFiles, fileRejections) => {
    if (fileRejections?.length) {
      setError(fileRejections[0].errors?.[0]?.message || "Invalid resume file");
      return;
    }
    if (!acceptedFiles?.length) return;
    const f = acceptedFiles[0];
    if (f.size > MAX_SIZE) return setError("Resume too large (max 10 MB).");
    setResumeFile(f);
    setResumeInfo({ name: f.name, size: f.size });
    setError("");
    setResult(null);
  }, []);

  const onDropJd = useCallback((acceptedFiles, fileRejections) => {
    if (fileRejections?.length) {
      setError(fileRejections[0].errors?.[0]?.message || "Invalid JD file");
      return;
    }
    if (!acceptedFiles?.length) return;
    const f = acceptedFiles[0];
    if (f.size > MAX_SIZE) return setError("JD too large (max 10 MB).");
    setJdFile(f);
    setJdText("");
    setError("");
    setResult(null);
  }, []);

  const { getRootProps: getResumeRoot, getInputProps: getResumeInput } = useDropzone({
    onDrop: onDropResume, accept: ACCEPT_MIME, multiple: false, maxSize: MAX_SIZE,
  });
  const { getRootProps: getJdRoot, getInputProps: getJdInput } = useDropzone({
    onDrop: onDropJd, accept: ACCEPT_MIME, multiple: false, maxSize: MAX_SIZE,
  });

  // Keyboard shortcut: Ctrl/Cmd + Enter to analyze
  useEffect(() => {
    const onKey = (e) => {
      const isCmdEnter = (e.ctrlKey || e.metaKey) && e.key === "Enter";
      if (isCmdEnter) {
        // if textarea focused -> run analyze
        const active = document.activeElement;
        if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
          e.preventDefault();
          analyze();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeFile, jdFile, jdText, serverOk]);

  const analyze = async () => {
    setError("");
    setResult(null);
    setCopied(null);
    if (!serverOk) return setError("Backend not available. Start backend and retry.");
    if (!resumeFile) return setError("Please upload your resume.");
    if (!jdFile && !jdText.trim()) return setError("Please provide a Job Description (upload file or paste text).");

    const fd = new FormData();
    fd.append("resume", resumeFile);
    if (jdText.trim()) fd.append("job_description", jdText.trim());
    else if (jdFile) fd.append("jd_file", jdFile);

    try {
      setLoading(true);
      const res = await api.post("/api/jd-match", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const data = res?.data ?? {};
      if (!data.success && data.message) return setError(data.message || "Analysis failed");
      setResult(data);
    } catch (err) {
      console.error("JD match error", err);
      const msg = err?.response?.data?.message || err?.message || "Server error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Pretty two-column PDF generation (client-side)
  const downloadPrettyPDF = async () => {
    if (!result) return setError("No result to export.");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 36;
      const columnGap = 12;
      const colWidth = (pageWidth - margin*2 - columnGap) / 2;
      let y = 40;

      // Title
      doc.setFontSize(18);
      doc.setTextColor("#1f2937");
      doc.text("ResumeForge — Match Report", margin, y);
      y += 28;

      // Scores on top right
      doc.setFontSize(12);
      doc.text(`Match Score: ${result.match_score ?? "-" }%`, margin, y);
      doc.text(`ATS Score: ${result.ats_score ?? "-" }%`, margin + colWidth + columnGap, y);
      y += 22;

      // Draw a horizontal line
      doc.setDrawColor(220);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Left column: matched/missing & metrics
      let leftX = margin;
      let rightX = margin + colWidth + columnGap;
      let leftY = y;
      let rightY = y;

      doc.setFontSize(11);
      doc.setTextColor("#0f172a");

      // Matched skills
      doc.setFontSize(12);
      doc.text("Matched Skills", leftX, leftY);
      leftY += 16;
      doc.setFontSize(10);
      doc.setTextColor("#0b6623");
      (result.matched_skills || []).slice(0, 60).forEach((k) => {
        doc.text(`• ${k}`, leftX, leftY);
        leftY += 12;
        if (leftY > 740) { doc.addPage(); leftY = 40; }
      });

      // Missing skills (right column top)
      doc.setFontSize(12);
      doc.setTextColor("#0f172a");
      doc.text("Missing Skills", rightX, rightY);
      rightY += 16;
      doc.setFontSize(10);
      doc.setTextColor("#8b1a2f");
      (result.missing_skills || []).slice(0, 60).forEach((k) => {
        doc.text(`• ${k}`, rightX, rightY);
        rightY += 12;
        if (rightY > 740) { doc.addPage(); rightY = 40; }
      });

      // Metrics under matched (left)
      leftY += 10;
      doc.setFontSize(12);
      doc.setTextColor("#0f172a");
      doc.text("Metrics", leftX, leftY);
      leftY += 16;
      doc.setFontSize(10);
      doc.setTextColor("#0f172a");
      const breakdown = result.breakdown || {};
      Object.keys(breakdown).forEach((k) => {
        const score = breakdown[k]?.score ?? (typeof breakdown[k] === "number" ? breakdown[k] : "-");
        doc.text(`${k.replace(/_/g, " ")}: ${score}%`, leftX, leftY);
        leftY += 12;
        if (leftY > 740) { doc.addPage(); leftY = 40; }
      });

      // Suggestions under metrics
      leftY += 8;
      doc.setFontSize(12);
      doc.text("Suggestions", leftX, leftY);
      leftY += 14;
      doc.setFontSize(10);
      (result.suggestions || []).slice(0, 40).forEach((s) => {
        // wrap text
        const lines = doc.splitTextToSize(s, colWidth - 10);
        doc.text(lines, leftX, leftY);
        leftY += lines.length * 12;
        if (leftY > 740) { doc.addPage(); leftY = 40; }
      });

      // JD preview (right column below missing)
      rightY += 8;
      doc.setFontSize(12);
      doc.text("JD Preview (plain text extract)", rightX, rightY);
      rightY += 14;
      doc.setFontSize(9);
      const plainJD = (result.highlighted_jd_html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000);
      const jdLines = doc.splitTextToSize(plainJD, colWidth - 10);
      doc.text(jdLines, rightX, rightY);
      rightY += jdLines.length * 12;

      // Save PDF
      doc.save(`jd-match-report-${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF error", e);
      setError("Failed to create PDF. Try again.");
    }
  };

  // Save result to backend (POST /api/results) — requires JWT to attach to user; otherwise saved anonymously
  const saveResult = async () => {
    if (!result) return setError("No result to save.");
    try {
      // if user has token, api will include Authorization header
      const payload = {
        title: `Match ${new Date().toLocaleString()}`,
        ...result
      };
      const res = await api.post("/api/results", payload);
      if (res.data && res.data.success) {
        // success feedback
        alert("Result saved to your account.");
      } else {
        setError(res.data?.message || "Failed to save result.");
      }
    } catch (e) {
      console.error("save result error", e);
      setError("Failed to save result. Are you logged in?");
    }
  };

  const copyText = async (txt, id) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(id);
      setTimeout(() => setCopied(null), 2200);
    } catch {
      setError("Clipboard not available");
    }
  };

  const openApplyModal = (s) => setApplyModal({ open: true, suggestion: s });
  const closeApplyModal = () => setApplyModal({ open: false, suggestion: "" });

  const renderHighlightedJD = (htmlStr) => {
    return { __html: htmlStr || "<div class='text-xs text-slate-500'>No JD provided</div>" };
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-100 via-indigo-50 to-sky-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-indigo-900">JD Matcher — Resume ↔ Job Description</h1>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = navigateToHistory} title="History" className="px-3 py-2 bg-white/90 rounded-md shadow">
              <FiList />
            </button>
            <button onClick={downloadPrettyPDF} title="Pretty PDF" className="px-3 py-2 bg-white/90 rounded-md shadow">
              <FiDownload />
            </button>
            <button onClick={saveResult} title="Save result" className="px-3 py-2 bg-white/90 rounded-md shadow">
              <FiSave />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border shadow">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Upload Resume</label>
                <div {...getResumeRoot()} className={`mt-2 p-3 rounded-lg border-2 border-dashed cursor-pointer ${resumeFile ? "border-slate-300 bg-white/60" : "border-indigo-200 bg-white/50"}`}>
                  <input {...getResumeInput()} />
                  <div className="flex items-center gap-3">
                    <FiUploadCloud className="text-2xl text-indigo-600" />
                    <div>
                      <div className="text-sm">{resumeFile ? resumeInfo?.name : "Drag & drop or click to browse"}</div>
                      <div className="text-xs text-slate-500">{resumeFile ? `${(resumeInfo.size/(1024*1024)).toFixed(2)} MB` : "PDF or DOCX (max 10 MB)"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Job Description (paste or upload)</label>
                <div className="mt-2">
                  <div {...getJdRoot()} className={`p-3 rounded-lg border-2 border-dashed cursor-pointer ${jdFile ? "border-slate-300 bg-white/60" : "border-indigo-200 bg-white/50"}`}>
                    <input {...getJdInput()} />
                    <div className="flex items-center gap-3">
                      <FiUploadCloud className="text-xl text-indigo-600" />
                      <div className="text-sm">{jdFile ? jdFile.name : "Upload JD file (optional)"}</div>
                    </div>
                  </div>

                  <textarea value={jdText} onChange={(e) => { setJdText(e.target.value); if (e.target.value) setJdFile(null); }} placeholder="Or paste JD here..." rows={6} className="w-full p-3 rounded-md border bg-white/70 mt-2" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={analyze} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
                <button onClick={() => { setResumeFile(null); setResumeInfo(null); setJdFile(null); setJdText(""); setResult(null); setError(""); }} className="px-4 py-2 border rounded-lg">
                  Reset
                </button>
                <div className="ml-auto text-xs text-slate-600">Tip: Press Ctrl/Cmd+Enter to analyze quickly</div>
              </div>
              {error && <div className="text-sm text-rose-600">{error}</div>}
            </div>
          </motion.div>

          <motion.div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border shadow">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="w-1/2 min-w-[140px]"><AnimatedDonut value={result?.match_score ?? 0} label="Match Score" /></div>
                <div className="w-1/2 min-w-[140px]"><AnimatedDonut value={result?.ats_score ?? 0} label="ATS Score" /></div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 rounded-md bg-white/90 border">
                  <div className="flex items-center justify-between mb-2"><div className="text-sm font-semibold">Matched Skills</div><div className="text-xs text-slate-600">{(result?.matched_skills ?? []).length}</div></div>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>{(result?.matched_skills ?? []).length ? result.matched_skills.map((k) => <ChipAnim key={k} text={k} kind="matched" />) : <div className="text-xs text-slate-500">—</div>}</AnimatePresence>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-white/90 border">
                  <div className="flex items-center justify-between mb-2"><div className="text-sm font-semibold">Missing Skills</div><div className="text-xs text-slate-600">{(result?.missing_skills ?? []).length}</div></div>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>{(result?.missing_skills ?? []).length ? result.missing_skills.map((k) => <ChipAnim key={`x-${k}`} text={k} kind="missing" />) : <div className="text-xs text-slate-500">—</div>}</AnimatePresence>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-white/90 border">
                  <div className="text-sm font-semibold mb-2">Quick Metrics</div>
                  <div className="text-xs text-slate-600">Similarity: <span className="font-semibold">{result?.similarity_percent ?? "-" }%</span></div>
                  <div className="text-xs text-slate-600">Words: <span className="font-semibold">{result?.meta?.word_count ?? "-"}</span></div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-md bg-white/95 border">
                <div className="flex items-center justify-between mb-2"><div className="text-sm font-semibold">JD Preview (highlights)</div><div className="text-xs text-slate-500">Matched = green · Missing = red</div></div>
                <div className="max-h-48 overflow-auto p-2 border rounded-sm bg-white">{result ? <div dangerouslySetInnerHTML={{ __html: result.highlighted_jd_html }} /> : <div className="text-xs text-slate-500">Upload JD to see highlights</div>}</div>
              </div>

              <div className="mt-2 p-3 rounded-md bg-white/95 border">
                <div className="flex items-center justify-between mb-2"><div className="text-sm font-semibold">AI Suggestions</div><div /></div>
                <div className="space-y-2">
                  {(result?.suggestions && result.suggestions.length) ? result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-1 text-sm text-slate-800">{s}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyText(s, `s-${i}`)} className="p-2 rounded-md bg-indigo-50 text-indigo-700">{copied === `s-${i}` ? <FiCheck /> : <FiCopy />}</button>
                        <button onClick={() => openApplyModal(s)} className="p-2 rounded-md bg-sky-50 text-sky-700">Apply</button>
                      </div>
                    </div>
                  )) : <div className="text-xs text-slate-500">Suggestions will appear after analysis.</div>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {applyModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => closeApplyModal()} />
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="relative z-50 w-full max-w-2xl p-6 rounded-xl bg-white shadow-xl">
              <div className="flex items-start justify-between">
                <div><h3 className="text-lg font-semibold text-indigo-900">Apply Suggestion</h3><p className="text-sm text-slate-600 mt-1">Example text & tips to apply this suggestion to your resume</p></div>
                <button onClick={() => closeApplyModal()} className="text-indigo-600">Close</button>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-indigo-800 mb-2">Suggestion</div>
                <div className="p-3 rounded-md bg-indigo-50 text-indigo-900">{applyModal.suggestion}</div>

                <div className="mt-4 text-sm text-indigo-800 font-medium">Example / Template</div>
                <textarea readOnly value={generateApplyExample(applyModal.suggestion)} className="w-full mt-2 p-3 rounded-md bg-gray-50 border h-36" />

                <div className="mt-4 flex gap-3">
                  <button onClick={() => copyText(generateApplyExample(applyModal.suggestion), "apply-example")} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Copy Example</button>
                  <button onClick={() => copyText(applyModal.suggestion, "apply-sugg")} className="px-4 py-2 border rounded-md">Copy Suggestion</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// helper for modal
function generateApplyExample(sugg) {
  if (!sugg) return "";
  const low = sugg.toLowerCase();
  if (low.includes("add") && low.includes("skills")) {
    const parts = sugg.split(":");
    const after = parts.length > 1 ? parts[1] : "your relevant skill here";
    return `Skills (example): ${after.trim()}\n\nExperience bullet example:\n• Implemented X using ${after.split(",")[0].trim()} resulting in Y% improvement.`;
  }
  if (low.includes("quantify") || low.includes("numbers") || low.includes("quantifiable")) {
    return "Example bullets:\n• Increased conversion by 23% by optimizing checkout flow.\n• Reduced costs by $50k annually by automating reports.";
  }
  return `Example: ${sugg}`;
}
