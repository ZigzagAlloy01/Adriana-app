import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CalendarPlus, MapPin } from "lucide-react";
import { createEvent, listEvents } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { Event } from "@/types/domain";

export default function CalendarPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!coupleId) return;
    setEvents(await listEvents(coupleId));
  }, [coupleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!coupleId || !title.trim() || !startsAt) return;

    setLoading(true);
    setError(null);
    try {
      await createEvent(coupleId, {
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        description: description.trim() || null,
        location: location.trim() || null,
      });
      setTitle("");
      setStartsAt("");
      setDescription("");
      setLocation("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo crear la cita."));
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
            <CalendarPlus className="size-5 text-rose-600" />
            <h1 className="m-0 text-2xl font-semibold text-slate-950">Citas</h1>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo" className="w-full rounded-lg border border-slate-200 p-3" required />
          <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3" required />
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lugar" className="w-full rounded-lg border border-slate-200 p-3" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Notas" className="min-h-24 w-full rounded-lg border border-slate-200 p-3" />
          <button disabled={loading} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white disabled:opacity-60">{loading ? "Guardando..." : "Guardar cita"}</button>
        </form>

        <section className="space-y-3">
          {events.length === 0 ? <p className="rounded-lg bg-white p-5 text-slate-500 shadow-sm ring-1 ring-slate-200">No hay citas registradas.</p> : null}
          {events.map((item) => (
            <article key={item.id} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-rose-600">{new Date(item.starts_at).toLocaleString()}</p>
              <h2 className="m-0 mt-1 text-lg font-semibold text-slate-950">{item.title}</h2>
              {item.location && (
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="size-4" />
                  {item.location}
                </p>
              )}
              {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
