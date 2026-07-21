import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { listNotifications, markNotificationRead } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import type { Notification } from "@/types/domain";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setNotifications(await listNotifications());
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRead(notification: Notification) {
    if (notification.read) return;

    try {
      await markNotificationRead(notification.id);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo marcar la notificacion."));
    }
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
            Volver al Dashboard
          </a>
        </div>
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-rose-600" />
            <h1 className="m-0 text-2xl font-semibold text-slate-950">Notificaciones</h1>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </section>

        {notifications.length === 0 ? <p className="rounded-lg bg-white p-5 text-slate-500 shadow-sm ring-1 ring-slate-200">No hay notificaciones.</p> : null}
        {notifications.map((notification) => (
          <article key={notification.id} className="flex items-start justify-between gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className={notification.read ? "text-sm font-semibold text-slate-500" : "text-sm font-semibold text-rose-600"}>{notification.kind}</p>
              <h2 className="m-0 mt-1 text-lg font-semibold text-slate-950">{notification.title}</h2>
              {notification.body && <p className="mt-2 text-sm text-slate-600">{notification.body}</p>}
              <p className="mt-3 text-xs text-slate-400">{new Date(notification.created_at).toLocaleString()}</p>
            </div>
            <button onClick={() => void handleRead(notification)} disabled={notification.read} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40" aria-label="Marcar leida">
              <CheckCheck className="size-5" />
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
