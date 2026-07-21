import type { Memory } from "@/types/dashboard";

export default function MemoriesPreview({ memories }: { memories: Memory[] }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="m-0 text-base font-semibold text-slate-950">Recuerdos recientes</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {memories.length === 0 ? (
          <p className="text-sm text-slate-400">Aun no hay recuerdos.</p>
        ) : (
          memories.map((memory) => (
            <span key={memory.id} className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">
              {memory.title}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
