// ResumeFormStep.jsx
import React, { useState } from "react";

export default function ResumeFormStep({ step, data, update }) {
  // Step-specific small UI
  if (step === 1) {
    const personal = data.personal || {};
    return (
      <div className="space-y-3">
        <label className="block">Full name</label>
        <input value={personal.name || ""} onChange={e=>update("personal.name", e.target.value)} className="w-full p-2 border rounded" />
        <label>Role / Title</label>
        <input value={personal.role || ""} onChange={e=>update("personal.role", e.target.value)} className="w-full p-2 border rounded" />
        <label>Email</label>
        <input value={personal.email || ""} onChange={e=>update("personal.email", e.target.value)} className="w-full p-2 border rounded" />
        <label>Phone</label>
        <input value={personal.phone || ""} onChange={e=>update("personal.phone", e.target.value)} className="w-full p-2 border rounded" />
        <label>Location</label>
        <input value={personal.location || ""} onChange={e=>update("personal.location", e.target.value)} className="w-full p-2 border rounded" />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <label className="block">Professional Summary</label>
        <textarea value={data.summary || ""} onChange={e=>update("summary", e.target.value)} className="w-full p-3 border rounded h-40" />
      </div>
    );
  }

  if (step === 3) {
    const exp = data.experience || [];
    const addItem = () => {
      const next = [...exp, { title: "", company: "", start: "", end: "", bullets: [""] }];
      update("experience", next);
    };
    const change = (i, field, val) => {
      const next = JSON.parse(JSON.stringify(exp));
      next[i][field] = val;
      update("experience", next);
    };
    return (
      <div>
        <div className="space-y-3">
          {exp.map((e, idx) => (
            <div key={idx} className="border rounded p-3">
              <input placeholder="Title" value={e.title} onChange={ev=>change(idx,"title",ev.target.value)} className="w-full p-2 border rounded mb-2" />
              <input placeholder="Company" value={e.company} onChange={ev=>change(idx,"company",ev.target.value)} className="w-full p-2 border rounded mb-2" />
              <div className="flex gap-2">
                <input placeholder="Start" value={e.start} onChange={ev=>change(idx,"start",ev.target.value)} className="p-2 border rounded w-1/2" />
                <input placeholder="End" value={e.end} onChange={ev=>change(idx,"end",ev.target.value)} className="p-2 border rounded w-1/2" />
              </div>
            </div>
          ))}
          <button onClick={addItem} className="mt-3 px-3 py-1 rounded border">Add experience</button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    const ed = data.education || [];
    const add = ()=> update("education", [...ed, {degree:"", school:"", year:""}]);
    return (
      <div>
        {ed.map((it, i)=>(
          <div key={i} className="mb-3">
            <input placeholder="Degree" value={it.degree} onChange={e=>{ const n=[...ed]; n[i].degree=e.target.value; update("education",n)}} className="w-full p-2 border rounded mb-2" />
            <input placeholder="School" value={it.school} onChange={e=>{ const n=[...ed]; n[i].school=e.target.value; update("education",n)}} className="w-full p-2 border rounded mb-2" />
          </div>
        ))}
        <button onClick={add} className="px-3 py-1 rounded border">Add education</button>
      </div>
    );
  }

  if (step === 5) {
    const skills = data.skills || [];
    const add = ()=> update("skills",[...skills, ""]);
    return (
      <div>
        <div className="space-y-2">
          {skills.map((s,i)=>(
            <input key={i} value={s} onChange={e=>{ const n=[...skills]; n[i]=e.target.value; update("skills",n)}} className="w-full p-2 border rounded" />
          ))}
        </div>
        <button onClick={add} className="mt-3 px-3 py-1 border">Add skill</button>
      </div>
    );
  }

  if (step === 6) {
    const pj = data.projects || [];
    const add = ()=> update("projects",[...pj,{name:"",desc:""}]);
    return (
      <div>
        {pj.map((p,i)=>(
          <div key={i} className="mb-3">
            <input placeholder="Project name" value={p.name} onChange={e=>{ const n=[...pj]; n[i].name=e.target.value; update("projects",n)}} className="w-full p-2 border rounded mb-2" />
            <textarea placeholder="Description" value={p.desc} onChange={e=>{ const n=[...pj]; n[i].desc=e.target.value; update("projects",n)}} className="w-full p-2 border rounded"></textarea>
          </div>
        ))}
        <button onClick={add} className="mt-3 px-3 py-1 border">Add project</button>
      </div>
    );
  }

  return null;
}
