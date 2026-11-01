// src/pages/ResumeBuilderWizard.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ResumeFormStep from "../components/resume/ResumeFormStep";
import { useResume } from "../context/ResumeContext";
import ResumePreview from "../components/resume/ResumePreview";

const steps = [
  "Personal Info",
  "Summary",
  "Experience",
  "Education",
  "Skills",
  "Projects",
];

export default function ResumeBuilderWizard() {
  const navigate = useNavigate();
  const { data, setData } = useResume();
  const [step, setStep] = useState(1);

  const update = (path, value) => {
    const keys = path.split(".");
    const next = { ...data };
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setData(next);
  };

  const nextStep = () => {
    if (step < steps.length) setStep(step + 1);
    else navigate("/dashboard/resume/editor");
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Progress Bar */}
      <div className="w-full bg-white shadow px-6 py-4 border-b">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  step === i + 1
                    ? "bg-indigo-600 text-white"
                    : step > i + 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    step > i + 1 ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Form Step */}
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Step {step}: {steps[step - 1]}
          </h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <ResumeFormStep step={step} data={data} update={update} />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-5 py-2 rounded-lg border bg-gray-100 text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition"
            >
              {step < steps.length ? "Continue" : "Finish"}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-2xl shadow p-6 border hidden lg:block">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Live Preview
          </h2>
          <div className="h-[600px] overflow-auto border rounded-lg">
            <ResumePreview html={`<div style="padding:20px;font-family:Inter">
              <h1>${data.personal?.name || "Your Name"}</h1>
              <p>${data.personal?.role || "Your Title"}</p>
              <p>${data.personal?.email || "email@example.com"}</p>
              <p>${data.summary || "Your professional summary will appear here..."}</p>
            </div>`} />
          </div>
        </div>
      </div>
    </div>
  );
}
