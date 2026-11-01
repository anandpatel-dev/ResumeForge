// frontend/src/pages/JDHistory.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { FiDownload } from "react-icons/fi";

export default function JDHistory() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/results");
        if (res.data && res.data.success) setItems(res.data.results || []);
        else setErr(res.data?.message || "Failed to fetch history");
      } catch (e) {
        setErr("Failed to fetch history. Make sure you're logged in.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Saved Results</h1>
        {err && <div className="text-rose-600 mb-2">{err}</div>}
        <div className="space-y-4">
          {items.length === 0 && <div className="text-sm text-slate-600">No saved results found.</div>}
          {items.map(it => (
            <div key={it.id} className="p-4 rounded-md bg-white shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{it.title || `Result ${it.id}`}</div>
                <div className="text-xs text-slate-500">{new Date(it.created_at).toLocaleString()}</div>
                <div className="text-xs text-slate-600 mt-1">Match: {it.payload.match_score ?? "-"}% • ATS: {it.payload.ats_score ?? "-"}%</div>
              </div>
              <div className="flex items-center gap-2">
                <a className="px-3 py-1 bg-indigo-50 rounded-md text-indigo-700" href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(it.payload))}`} download={`result-${it.id}.json`}>
                  <FiDownload /> JSON
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
