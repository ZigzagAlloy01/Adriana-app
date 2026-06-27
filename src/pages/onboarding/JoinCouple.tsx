import { useState } from "react";
import { joinCouple } from "@/services/couples";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import { useNavigate } from "react-router-dom";

export default function JoinCouple() {
  const { user } = useAuthStore();
  const fetchCouple = useCoupleStore((s) => s.fetchCouple);
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleJoin = async () => {
    if (!user || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await joinCouple(user.id, code.trim());
      await fetchCouple();
      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Unirse a pareja 💌</h2>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Ingresa el código"
        className="w-full border p-2 rounded"
      />

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {success ? (
        <p className="text-green-600 text-sm font-medium animate-pulse">
          ¡Te uniste correctamente! ❤️
        </p>
      ) : (
        <button
          onClick={handleJoin}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Uniéndote..." : "Unirme"}
        </button>
      )}
    </div>
  );
}