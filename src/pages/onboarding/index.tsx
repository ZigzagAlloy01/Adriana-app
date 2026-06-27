import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCoupleStore } from "@/store/coupleStore";
import CreateCouple from "./CreateCouple";
import JoinCouple from "./JoinCouple";

type Mode = "home" | "create" | "join";

export default function Onboarding() {
  const [mode, setMode] = useState<Mode>("home");
  const coupleId = useCoupleStore((s) => s.coupleId);
  const navigate = useNavigate();

  useEffect(() => {
    if (coupleId) {
      navigate("/dashboard", { replace: true });
    }
  }, [coupleId, navigate]);

  if (coupleId) return null;

  if (mode === "create") return <CreateCouple />;
  if (mode === "join") return <JoinCouple />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Bienvenido ❤️</h1>
          <p className="text-sm text-gray-500">
            Crea o únete a tu espacio de pareja
          </p>
        </div>

        <button
          onClick={() => setMode("create")}
          className="w-full bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition"
        >
          Crear pareja
        </button>

        <button
          onClick={() => setMode("join")}
          className="w-full bg-black text-white py-2 rounded-xl hover:bg-gray-800 transition"
        >
          Unirme a una pareja
        </button>
      </div>
    </div>
  );
}