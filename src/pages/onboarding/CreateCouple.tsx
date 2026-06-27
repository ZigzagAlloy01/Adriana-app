import { useState } from "react";
import { createCouple } from "@/services/couples";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";

export default function CreateCouple() {
  const { user } = useAuthStore();
  const fetchCouple = useCoupleStore((s) => s.fetchCouple);
  const navigate = useNavigate();

  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;

    console.log(await supabase.auth.getUser());

    setLoading(true);

    try {
      const inviteCode = await createCouple(user.id);
      setCode(inviteCode);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = async () => {
    setLoading(true);
    try {
      await fetchCouple();
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Crear pareja ❤️</h2>

      {!code ? (
        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-pink-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Creando..." : "Crear pareja"}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Comparte este código con tu pareja:
          </p>

          <div className="p-3 border rounded font-mono text-center">
            {code}
          </div>

          <button
            onClick={handleGoToDashboard}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Sincronizando..." : "Ir al dashboard"}
          </button>
        </div>
      )}
    </div>
  );
}