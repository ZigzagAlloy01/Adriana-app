import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Heart, Star } from "lucide-react";
import { createMemory, listMemories, toggleMemoryFavorite } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { Memory } from "@/types/domain";

export default function MemoriesPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [title, setTitle] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!coupleId) return;
    setMemories(await listMemories(coupleId));
  }, [coupleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!coupleId || !title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createMemory(coupleId, { title: title.trim(), memory_date: memoryDate || null, description: description.trim() || null });
      setTitle("");
      setMemoryDate("");
      setDescription("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo guardar el recuerdo."));
    } finally {
      setLoading(false);
    }
  }

  async function handleFavorite(memory: Memory) {
    await toggleMemoryFavorite(memory.id, !memory.favorite);
    await load();
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
            <Heart className="size-5 text-rose-600" />
            <h1 className="m-0 text-2xl font-semibold text-slate-950">Recuerdos</h1>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo" className="w-full rounded-lg border border-slate-200 p-3" required />
          <input type="date" value={memoryDate} onChange={(event) => setMemoryDate(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Historia" className="min-h-28 w-full rounded-lg border border-slate-200 p-3" />
          <button disabled={loading} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white disabled:opacity-60">{loading ? "Guardando..." : "Guardar recuerdo"}</button>
        </form>

        <section className="space-y-3">
          {memories.length === 0 ? <p className="rounded-lg bg-white p-5 text-slate-500 shadow-sm ring-1 ring-slate-200">Aun no hay recuerdos.</p> : null}
          {memories.map((memory) => (
            <article key={memory.id} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-rose-600">{memory.memory_date ?? "Sin fecha"}</p>
                  <h2 className="m-0 mt-1 text-lg font-semibold text-slate-950">{memory.title}</h2>
                </div>
                <button onClick={() => void handleFavorite(memory)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-amber-500" aria-label="Marcar favorito">
                  <Star className={memory.favorite ? "size-5 fill-amber-400 text-amber-400" : "size-5"} />
                </button>
              </div>
              {memory.description && <p className="mt-2 text-sm text-slate-600">{memory.description}</p>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
