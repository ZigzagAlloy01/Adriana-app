import { useEffect, useState } from "react";
import { Calendar, Check, Pencil } from "lucide-react";
import type { Couple, DashboardCounts } from "@/types/domain";

type Profile = {
  display_name?: string | null;
};

type Props = {
  couple: Couple | null;
  profile?: Profile | null;
  counts?: DashboardCounts;
  onAnniversarySave?: (date: string | null) => Promise<void>;
};

export default function CoupleHeader({ couple, profile, counts, onAnniversarySave }: Props) {
  const [editing, setEditing] = useState(false);
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversary_date ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnniversaryDate(couple?.anniversary_date ?? "");
  }, [couple?.anniversary_date]);

  async function handleSave() {
    if (!onAnniversarySave) return;

    setSaving(true);
    try {
      await onAnniversarySave(anniversaryDate || null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600">{"¡Hola " + profile?.display_name + "!"}</p>
          <h1 className="m-0 text-2xl font-semibold text-slate-950">{couple?.name ?? ": La historia que hacemos juntos"}</h1>
          <p className="mt-1 text-sm text-slate-500">Nuestro espacio privado de pareja :3</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Calendar className="size-4 text-rose-600" />
            {editing ? (
              <>
                <input type="date" value={anniversaryDate} onChange={(event) => setAnniversaryDate(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2" />
                <button onClick={() => void handleSave()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-white disabled:opacity-60">
                  <Check className="size-4" />
                  {saving ? "Guardando" : "Guardar"}
                </button>
              </>
            ) : (
              <>
                <span>Aniversario: {couple?.anniversary_date ?? "Sin fecha"}</span>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-medium">
                  <Pencil className="size-4" />
                  Editar
                </button>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-7">
          <span><b className="block text-slate-950">{counts?.events ?? 0}</b>Citas</span>
          <span><b className="block text-slate-950">{counts?.memories ?? 0}</b>Recuerdos</span>
          <span><b className="block text-slate-950">{counts?.photos ?? 0}</b>Fotos</span>
          <span><b className="block text-slate-950">{counts?.goals ?? 0}</b>Metas</span>
          <span><b className="block text-slate-950">{counts?.messages ?? 0}</b>Chat</span>
          <span><b className="block text-slate-950">{counts?.letters ?? 0}</b>Cartas</span>
          <span><b className="block text-slate-950">{counts?.unreadNotifications ?? 0}</b>Avisos</span>
        </div>
      </div>
    </section>
  );
}
