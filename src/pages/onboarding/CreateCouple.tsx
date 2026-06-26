import { useState } from "react";
import { createCouple } from "@/services/couples";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

export default function CreateCouple() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const inviteCode = await createCouple(user.id);
      setCode(inviteCode);
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
            onClick={() => navigate("/")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Ir al dashboard
          </button>
        </div>
      )}
    </div>
  );
}