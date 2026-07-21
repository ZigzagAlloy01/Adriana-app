import type { Event } from "@/types/dashboard";

export default function NextDateCard({ event }: { event: Event | null }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="m-0 text-sm font-medium text-slate-500">Proxima cita</h2>
      {event ? (
        <div className="mt-3">
          <p className="text-xl font-semibold text-slate-950">{event.title}</p>
          <p className="text-sm text-slate-500">{new Date(event.starts_at).toLocaleString()}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No hay citas proximas.</p>
      )}
    </section>
  );
}
