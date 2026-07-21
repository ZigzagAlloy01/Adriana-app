import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCouple } from "@/services/couples";
import { getErrorMessage } from "@/services/helpers";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";

export default function CreateCouple() {
  const { user } = useAuthStore();
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
  const navigate = useNavigate();
  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const displayName = typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : null;
      const inviteCode = await createCouple(anniversaryDate || null, displayName);
      setCode(inviteCode);
      await fetchCouple();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo crear la pareja."));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoToDashboard() {
    setLoading(true);
    try {
      await fetchCouple();
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo abrir el dashboard."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
      <div>
        <h2 className="m-0 text-xl font-semibold text-slate-950">Crear pareja</h2>
        <p className="mt-1 text-sm text-slate-500">El aniversario se usa para calcular el tiempo juntos.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!code ? (
        <div className="space-y-3">
          <input type="date" value={anniversaryDate} onChange={(event) => setAnniversaryDate(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3" />
          <button onClick={handleCreate} disabled={loading} className="w-full rounded-lg bg-rose-600 px-4 py-3 font-medium text-white disabled:opacity-60">
            {loading ? "Creando..." : "Crear pareja"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Comparte este codigo con tu pareja:</p>
          <div className="rounded-lg border border-slate-200 p-3 text-center font-mono text-lg text-slate-950">{code}</div>
          <button onClick={handleGoToDashboard} disabled={loading} className="w-full rounded-lg bg-slate-950 px-4 py-3 font-medium text-white disabled:opacity-60">
            {loading ? "Sincronizando..." : "Ir al dashboard"}
          </button>
        </div>
      )}
    </section>
  );
}
