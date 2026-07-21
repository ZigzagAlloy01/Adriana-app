import { Navigate, Route, Routes } from "react-router-dom";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard/Dashboard";
import CalendarPage from "@/pages/calendar/CalendarPage";
import GalleryPage from "@/pages/gallery/GalleryPage";
import MemoriesPage from "@/pages/memories/MemoriesPage";
import MessagesPage from "@/pages/messages/MessagesPage";
import GoalsPage from "@/pages/goals/GoalsPage";
import LettersPage from "@/pages/letters/LettersPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import ProtectedRoute from "@/routes/ProtectedRoute";

function protectedPage(page: React.ReactNode) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
      <Route path="/calendar" element={protectedPage(<CalendarPage />)} />
      <Route path="/gallery" element={protectedPage(<GalleryPage />)} />
      <Route path="/memories" element={protectedPage(<MemoriesPage />)} />
      <Route path="/messages" element={protectedPage(<MessagesPage />)} />
      <Route path="/letters" element={protectedPage(<LettersPage />)} />
      <Route path="/goals" element={protectedPage(<GoalsPage />)} />
      <Route path="/notifications" element={protectedPage(<NotificationsPage />)} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
