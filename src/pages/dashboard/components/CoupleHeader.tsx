import { useEffect, useRef, useState } from "react";
import { Calendar, Check, Pencil } from "lucide-react";
import type { Couple, DashboardCounts } from "@/types/domain";
import { updateCouple, updateUserProfile} from "@/services/couples";

type Profile = {
  display_name?: string | null;
};
// Component props interface defining couple metadata, user profile, and metric counters.
type Props = {
  couple: Couple | null;
  profile?: Profile | null;
  counts?: DashboardCounts;
  onCoupleUpdated?: () => Promise<void> | void;
};

export default function CoupleHeader({ couple, profile, counts, onCoupleUpdated }: Props) {
  // State management for inline editing mode, form data, loading status, and input auto-focus.
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    anniversary_date: "",
    display_name: "",
  });
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  // Derived validation checks to determine if form data was altered or if inputs are invalid.
  const hasChanges = 
    form.name.trim() !== (couple?.name ?? "") ||
    (form.anniversary_date || "") !==
     (couple?.anniversary_date?.slice(0, 10) ?? "") ||
     form.display_name.trim() !== (profile?.display_name ?? "");
  const isNameEmpty = form.name.trim() === "";
  // Synchronizes local form state whenever the parent couple prop changes or editing closes.
  useEffect(() => {
    if (!editing) {
      setForm({
        name: couple?.name ?? "",
        anniversary_date: couple?.anniversary_date?.slice(0, 10) ?? "",
        display_name: profile?.display_name ?? "",
      });
    }
  }, [couple, profile, editing]);
  // Automatically focuses the primary name input field when entering edit mode.
  useEffect(() => {
    if (editing) {
      nameInputRef.current?.focus();
    }
  }, [editing]);
  // Formats UTC ISO anniversary date strings into localized Spanish long-date text.
  const anniversaryText = couple?.anniversary_date
    ? new Date(couple.anniversary_date.slice(0, 10) + "T12:00:00").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Sin fecha";
  // Handles updating couple details in Supabase and triggers refresh callback on success.
  async function handleSave() {
    if (!couple) return;

    setSaving(true);

    try {
      const sameName = form.name.trim() === (couple.name ?? "");
      const sameDate =
        (form.anniversary_date || null) ===
        (couple.anniversary_date?.slice(0, 10) ?? null);
      const sameDisplayName = form.display_name.trim() === (profile?.display_name ?? "");

      if (sameName && sameDate && sameDisplayName) {
        setEditing(false);
        return;
      }

      if (!sameName || !sameDate) {
        await updateCouple(couple.id, {
          name: form.name,
          anniversary_date: form.anniversary_date || null,
        });
      }
      
      if (!sameDisplayName) {
        await updateUserProfile(form.display_name.trim());
      }

      setEditing(false);
      await onCoupleUpdated?.();

    } catch (error) {
      console.error(error);
      alert("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }
  // Resets local form input values and exits inline editing mode.
  function cancelEditing() {
    setForm({
      name: couple?.name ?? "",
      anniversary_date: couple?.anniversary_date?.slice(0, 10) ?? "",
      display_name: profile?.display_name ?? "",
    });

    setEditing(false);
  }
  //Dynamic counter grid summarizing overall shared couple statistics
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {editing ? (
            <>
              <div className="mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase">Tu nombre</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium"
                  placeholder="Tu nombre"
                  value={form.display_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      display_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase">Nombre de la Pareja</label>
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
              </div>
                

              <p className="mt-1 text-sm text-slate-500">
                <span>Nuestro espacio privado de pareja :3</span>
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
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !hasChanges || isNameEmpty}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-white disabled:opacity-60"
                >
                  <Check className="size-4" />
                  <span>{saving ? "Guardando..." : "Guardar"}</span>
                </button>

                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span>Cancelar</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-rose-600">
                <span>{profile?.display_name ? `¡Hola ${profile.display_name}!` : "¡Hola!"}</span>
              </p>

              <h1 className="m-0 text-2xl font-semibold text-slate-950">
                <span>{couple?.name ?? "Nuestra historia"}</span>
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                <span>Nuestro espacio privado de pareja :3</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Calendar className="size-4 text-rose-600" />

                <span>
                  Aniversario: {anniversaryText}
                </span>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:opacity-60"
                >
                  <Pencil className="size-4" />
                  <span>Editar</span>
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
