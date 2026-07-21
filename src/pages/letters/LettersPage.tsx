import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { createLetter, listLetters } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import type { TimelinePost } from "@/types/domain";

export default function LettersPage() {
  const user = useAuthStore((state) => state.user);
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [letters, setLetters] = useState<TimelinePost[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!coupleId) return;
    setLetters(await listLetters(coupleId));
  }, [coupleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!coupleId || !body.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createLetter(coupleId, body.trim());
      setBody("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo guardar la carta."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[360px_1fr]">
        <div>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
            Volver al Dashboard
          </a>
        </div>
        <form onSubmit={handleCreate} className="space-y-3 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-rose-600" />
            <h1 className="m-0 text-2xl font-semibold text-slate-950">Cartas</h1>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Escribe una carta" className="min-h-44 w-full rounded-lg border border-slate-200 p-3" required />
          <button disabled={loading || !body.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 p-3 font-medium text-white disabled:opacity-60">
            <Send className="size-4" />
            {loading ? "Guardando..." : "Guardar carta"}
          </button>
        </form>

        <section className="space-y-3">
          {letters.length === 0 ? <p className="rounded-lg bg-white p-5 text-slate-500 shadow-sm ring-1 ring-slate-200">Todavia no hay cartas.</p> : null}
          {letters.map((letter) => (
            <article key={letter.id} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-rose-600">{letter.created_by === user?.id ? "Tu carta" : "Carta recibida"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{letter.body}</p>
              <p className="mt-3 text-xs text-slate-400">{new Date(letter.created_at).toLocaleString()}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
