import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import type { ReactNode } from "react";
// Route guard component enforcing authentication and couple space linkage.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  // Retrieves current authentication session and active couple ID from Zustand state.
  const user = useAuthStore((state) => state.user);
  const coupleId = useCoupleStore((state) => state.coupleId);
  // Redirects unauthenticated traffic to login.
  if (!user) return <Navigate to="/auth/login" replace />;
  // Redirects authenticated users missing a couple context to setup onboarding flow.
  if (!coupleId) return <Navigate to="/onboarding" replace />;
  // Renders protected child components when guard requirements are fulfilled.
  return children;
}
