// TemplatePreviewModal.jsx
import React from "react";

export default function TemplatePreviewModal({ template, onClose }) {
  if (!template) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold">{template.name} — Preview</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">Close</button>
        </div>

        <div className="mt-4">
          <img src={template.preview} alt="preview" className="w-full h-[600px] object-cover rounded" />
        </div>
      </div>
    </div>
  );
}
