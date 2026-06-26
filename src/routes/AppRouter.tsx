import { Routes, Route, Navigate } from "react-router-dom";

import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard/Dashboard";

import ProtectedRoutes from "@/routes/ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      {/* 🔓 AUTH PUBLIC */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      {/* 💌 ONBOARDING (solo autenticado sin pareja) */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* ❤️ APP PROTEGIDA */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoutes>
            <Dashboard />
          </ProtectedRoutes>
        }
      />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
