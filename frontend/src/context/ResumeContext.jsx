// src/context/ResumeContext.jsx
import { createContext, useContext, useState, useMemo } from "react";

const ResumeContext = createContext(null);

const emptyResume = {
  basics: { name: "", label: "", email: "", phone: "", summary: "", location: { city: "", region: "", country: "" } },
  work: [],
  education: [],
  skills: [],
  projects: [],
  meta: { engine: "html", template_id: 1, theme_name: "" }, // default html engine
};

export function ResumeProvider({ children }) {
  const [data, setData] = useState(emptyResume);
  const [selectedTemplate, setSelectedTemplate] = useState(null); // html template
  const [selectedTheme, setSelectedTheme] = useState(null);       // jsonresume theme

  const value = useMemo(
    () => ({
      data,
      setData,
      selectedTemplate,
      setSelectedTemplate,
      selectedTheme,
      setSelectedTheme,
      reset: () => {
        setData(emptyResume);
        setSelectedTemplate(null);
        setSelectedTheme(null);
      },
    }),
    [data, selectedTemplate, selectedTheme]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export const useResume = () => useContext(ResumeContext) || { data: emptyResume, setData: () => {}, reset: () => {} };
