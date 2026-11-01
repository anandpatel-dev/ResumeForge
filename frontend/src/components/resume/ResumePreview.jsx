// ResumePreview.jsx
import React from "react";

export default function ResumePreview({ data }) {
  const d = data || {};
  const p = d.personal || {};
  return (
    <div className="bg-white rounded-xl shadow p-6" style={{minHeight: 420}}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{p.name || "Your Name"}</h1>
          <p className="text-sm text-slate-600">{p.role || "Professional Title"}</p>
        </div>
        <div className="text-sm text-right text-slate-600">
          <div>{p.email}</div>
          <div>{p.phone}</div>
        </div>
      </div>

      {d.summary && <div className="mb-4">
        <h4 className="font-semibold text-sm">Summary</h4>
        <p className="text-sm text-slate-700">{d.summary}</p>
      </div>}

      {d.experience && d.experience.length>0 && <div className="mb-3">
        <h4 className="font-semibold text-sm">Experience</h4>
        <div className="space-y-2">
          {d.experience.map((e,i)=>(
            <div key={i}>
              <div className="flex justify-between">
                <strong>{e.title || "Title"}</strong>
                <span className="text-sm text-slate-500">{e.start} - {e.end}</span>
              </div>
              <div className="text-sm text-slate-700">{e.company}</div>
            </div>
          ))}
        </div>
      </div>}

      {d.skills && d.skills.length>0 && <div className="mb-3">
        <h4 className="font-semibold text-sm">Skills</h4>
        <div className="flex flex-wrap gap-2 mt-2">
          {d.skills.map((s,i)=>(<span key={i} className="text-xs px-2 py-1 bg-slate-100 rounded">{s}</span>))}
        </div>
      </div>}
    </div>
  );
}
