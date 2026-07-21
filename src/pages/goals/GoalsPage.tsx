import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Check, Goal, Plus } from "lucide-react";
import { createChecklistItem, createGoal, listGoals, toggleChecklistItem, toggleGoal } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { GoalWithChecklist } from "@/types/domain";

export default function GoalsPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [goals, setGoals] = useState<GoalWithChecklist[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [checklistText, setChecklistText] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!coupleId) return;
    setGoals(await listGoals(coupleId));
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
      await createGoal(coupleId, title.trim(), description);
      setTitle("");
      setDescription("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo crear la meta."));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleGoal(goal: GoalWithChecklist) {
    await toggleGoal(goal.id, goal.status !== "completed");
    await load();
  }

  async function handleCreateChecklistItem(goal: GoalWithChecklist) {
    const itemTitle = checklistText[goal.id]?.trim();
    if (!itemTitle) return;

    await createChecklistItem(goal.id, itemTitle, goal.checklist_items.length);
    setChecklistText((current) => ({ ...current, [goal.id]: "" }));
    await load();
  }

  async function handleToggleItem(itemId: string, completed: boolean) {
    await toggleChecklistItem(itemId, completed);
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
            <Goal className="size-5 text-rose-600" />
            <h1 className="m-0 text-2xl font-semibold text-slate-950">Metas</h1>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meta" className="w-full rounded-lg border border-slate-200 p-3" required />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Detalles" className="min-h-24 w-full rounded-lg border border-slate-200 p-3" />
          <button disabled={loading} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white disabled:opacity-60">{loading ? "Creando..." : "Crear meta"}</button>
        </form>

        <section className="space-y-3">
          {goals.length === 0 ? <p className="rounded-lg bg-white p-5 text-slate-500 shadow-sm ring-1 ring-slate-200">No hay metas activas todavia.</p> : null}
          {goals.map((goal) => (
            <article key={goal.id} className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-semibold text-slate-950">{goal.title}</h2>
                  {goal.description && <p className="mt-1 text-sm text-slate-600">{goal.description}</p>}
                </div>
                <button onClick={() => void handleToggleGoal(goal)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium">
                  {goal.status === "completed" ? "Reabrir" : "Completar"}
                </button>
              </div>

              <div className="space-y-2">
                {goal.checklist_items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={item.completed} onChange={(event) => void handleToggleItem(item.id, event.target.checked)} />
                    <span className={item.completed ? "line-through opacity-60" : ""}>{item.title}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <input value={checklistText[goal.id] ?? ""} onChange={(event) => setChecklistText((current) => ({ ...current, [goal.id]: event.target.value }))} placeholder="Nuevo paso" className="min-w-0 flex-1 rounded-lg border border-slate-200 p-3" />
                <button onClick={() => void handleCreateChecklistItem(goal)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 font-medium text-white">
                  <Plus className="size-4" />
                  <Check className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
