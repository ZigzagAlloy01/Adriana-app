import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const coupleId = useCoupleStore((state) => state.coupleId);

  if (!user) return <Navigate to="/auth/login" replace />;
  if (!coupleId) return <Navigate to="/onboarding" replace />;

  return children;
}
