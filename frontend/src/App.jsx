// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Dashboard Layout & Pages
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Support from "./pages/Support";
import Settings from "./pages/Settings";

// Tools Pages
import ATSChecker from "./pages/ATSChecker";
import JDMatcher from "./pages/JDMatcher";
import JDHistory from "./pages/JDHistory";
import AICareerAssistant from "./pages/AICareerAssistant";

// Resume Builder Pages (flow)
import ResumeBuilderLanding from "./pages/ResumeBuilderLanding";   // step 1 landing
import TemplateGallery from "./pages/TemplateGallery";             // step 2 gallery
import StartChoice from "./pages/StartChoice";                     // step 3 start
import ResumeBuilderWizard from "./pages/ResumeBuilderWizard";     // step 4 builder
import ResumeEditor from "./pages/ResumeEditor";                   // step 5 editor

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ===== Public Routes ===== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ===== Protected Dashboard Routes ===== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Dashboard Page */}
          <Route index element={<Dashboard />} />

          {/* Tools */}
          <Route path="ats" element={<ATSChecker />} />
          <Route path="jd-matcher" element={<JDMatcher />} />
          <Route path="history" element={<JDHistory />} />
          <Route path="career-assistant" element={<AICareerAssistant />} />

          {/* Resume Builder Flow */}
          <Route path="resume" element={<ResumeBuilderLanding />} />
          <Route path="resume/templates" element={<TemplateGallery />} />
          <Route path="resume/start" element={<StartChoice />} />
          <Route path="resume/builder/step/:id" element={<ResumeBuilderWizard />} />
          <Route path="resume/editor" element={<ResumeEditor />} />

          {/* Other Pages */}
          <Route path="about" element={<About />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
