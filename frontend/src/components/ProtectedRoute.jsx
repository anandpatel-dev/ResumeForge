// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // while restoring session, show nothing (or a loader)
  if (loading) return null; // or return a small loader component

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
