import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinCouple } from "@/services/couples";
import { getErrorMessage } from "@/services/helpers";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";

export default function JoinCouple() {
  const { user } = useAuthStore();
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleJoin() {
    if (!user || !code.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await joinCouple(code.trim());
      await fetchCouple();
      setSuccess(true);
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught, "Codigo invalido."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
      <div>
        <h2 className="m-0 text-xl font-semibold text-slate-950">Unirse a pareja</h2>
        <p className="mt-1 text-sm text-slate-500">Usa el codigo privado de invitacion.</p>
      </div>

      <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ingresa el codigo" className="w-full rounded-lg border border-slate-200 p-3" />

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Te uniste correctamente.</p>}

      <button onClick={handleJoin} disabled={loading || !code.trim()} className="w-full rounded-lg bg-slate-950 px-4 py-3 font-medium text-white disabled:opacity-60">
        {loading ? "Uniendote..." : "Unirme"}
      </button>
    </section>
  );
}
