import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCoupleStore } from "@/store/coupleStore";
import CreateCouple from "./CreateCouple";
import JoinCouple from "./JoinCouple";
// Union type defining the distinct wizard navigation steps for onboarding flow.
type Mode = "home" | "create" | "join";

export default function Onboarding() {
  // Navigation mode switcher local state.
  const [mode, setMode] = useState<Mode>("home");
  const coupleId = useCoupleStore((state) => state.coupleId);
  const navigate = useNavigate();
  // Automatic redirect effect skipping onboarding if couple context is already linked.
  useEffect(() => {
    if (coupleId) navigate("/dashboard", { replace: true });
  }, [coupleId, navigate]);
  // Prevent flash of onboarding UI while redirecting active couple session.
  if (coupleId) return null;
  //Entry menu step selecting between creating or joining a couple space
  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50 p-4">
      <div className="w-full max-w-md space-y-4">
        {mode === "home" && (
          <section className="space-y-4 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
            <div>
              <h1 className="m-0 text-2xl font-semibold text-slate-950">Configura tu pareja</h1>
              <p className="mt-1 text-sm text-slate-500">Crea un espacio nuevo o unete con un codigo.</p>
            </div>
            <button onClick={() => setMode("create")} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white">Crear pareja</button>
            <button onClick={() => setMode("join")} className="w-full rounded-lg bg-slate-950 p-3 font-medium text-white">Unirme a una pareja</button>
          </section>
        )}
        {mode !== "home" && (
          <button onClick={() => setMode("home")} className="text-sm font-medium text-rose-700">Volver</button>
        )}
        {mode === "create" && <CreateCouple />}
        {mode === "join" && <JoinCouple />}
      </div>
    </main>
  );
}
