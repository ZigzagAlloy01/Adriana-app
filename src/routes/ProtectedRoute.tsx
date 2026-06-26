import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const coupleId = useCoupleStore((s) => s.coupleId);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  if (!coupleId) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}