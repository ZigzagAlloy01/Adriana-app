import { useEffect, useRef, useState } from "react";
import { Calendar, Check, Pencil } from "lucide-react";
import type { Couple, DashboardCounts } from "@/types/domain";
import { updateCouple } from "@/services/couples";

type Profile = {
  display_name?: string | null;
};

type Props = {
  couple: Couple | null;
  profile?: Profile | null;
  counts?: DashboardCounts;
  onCoupleUpdated?: () => Promise<void> | void;
};

export default function CoupleHeader({ couple, profile, counts, onCoupleUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    anniversary_date: "",
  });
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasChanges = 
    form.name.trim() !== (couple?.name ?? "") ||
    (form.anniversary_date || "") !==
     (couple?.anniversary_date?.slice(0, 10) ?? "");
  const isNameEmpty = form.name.trim() === "";

  useEffect(() => {
    if (!editing) {
      setForm({
        name: couple?.name ?? "",
        anniversary_date: couple?.anniversary_date?.slice(0, 10) ?? "",
      });
    }
  }, [couple, editing]);

  useEffect(() => {
    if (editing) {
      nameInputRef.current?.focus();
    }
  }, [editing]);

  const anniversaryText = couple?.anniversary_date
    ? new Date(couple.anniversary_date.slice(0, 10) + "T12:00:00").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Sin fecha";

  async function handleSave() {
    if (!couple) return;

    setSaving(true);

    try {
      const sameName = form.name.trim() === (couple.name ?? "");
      const sameDate =
        (form.anniversary_date || null) ===
        (couple.anniversary_date?.slice(0, 10) ?? null);

      if (sameName && sameDate) {
        setEditing(false);
        return;
      }

      await updateCouple(couple.id, {
        name: form.name,
        anniversary_date: form.anniversary_date || null,
      });

      setEditing(false);

      await onCoupleUpdated?.();

    } catch (error) {
      console.error(error);
      alert("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setForm({
      name: couple?.name ?? "",
      anniversary_date: couple?.anniversary_date?.slice(0, 10) ?? "",
    });

    setEditing(false);
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600">
            {profile?.display_name ? `¡Hola ${profile.display_name}!` : "¡Hola!"}
          </p>

          {editing ? (
            <>
              <input
                ref={nameInputRef}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-2xl font-semibold"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }

                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleSave();
                  }

                  if (e.key === "Escape") {
                    cancelEditing();
                  }
                }}
              />

              <p className="mt-1 text-sm text-slate-500">
                Nuestro espacio privado de pareja :3
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Calendar className="size-4 text-rose-600" />

                <input
                  type="date"
                  value={form.anniversary_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      anniversary_date: e.target.value,
                    })
                  }

                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSave();
                    }

                    if (e.key === "Escape") {
                      cancelEditing();
                    }
                  }}

                  className="rounded-lg border border-slate-200 px-3 py-2"
                />

                <button
                  onClick={() => void handleSave()}
                  disabled={saving || !hasChanges || isNameEmpty}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-white disabled:opacity-60"
                >
                  <Check className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>

                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="m-0 text-2xl font-semibold text-slate-950">
                {couple?.name ?? "Nuestra historia"}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Nuestro espacio privado de pareja :3
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Calendar className="size-4 text-rose-600" />

                <span>
                  Aniversario: {anniversaryText}
                </span>

                <button
                  disabled={saving}
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:opacity-60"
                >
                  <Pencil className="size-4" />
                  Editar
                </button>
              </div>
            </>
          )}
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
