import { useCallback, useEffect, useState, useLayoutEffect, useRef } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { listMessages, sendMessage } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import type { Message } from "@/types/domain";

export default function MessagesPage() {
  // Retrieves active user context and shared couple ID from Zustand stores.
  const user = useAuthStore((state) => state.user);
  const coupleId = useCoupleStore((state) => state.coupleId);
  // Local state for chat message feed, input field, error state, and send status.
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Memoized callback function fetching full message history for active couple.
  const load = useCallback(async () => {
    if (!coupleId) return;
    setMessages(await listMessages(coupleId));
  }, [coupleId]);
  // Initializes message feed and subscribes to Supabase real-time database changes.
  useEffect(() => {
    if (!coupleId) return;

    void load();
    // Realtime channel listener updating feed whenever Postgres messages table mutates.
    const channel = supabase
      .channel(`messages:${coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` }, () => {
        void load();
      })
      .subscribe();
    // Clean up function removing channel subscription on component unmount.
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, load]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;

    if(!container) return;

    container.scrollTop = 0;
  }, [messages]);

  // Form handler sending outgoing text messages.
  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!coupleId || !body.trim()) return;

    setSending(true);
    setError(null);
    try {
      await sendMessage(coupleId, body.trim());
      setBody("");
      // await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo enviar el mensaje."));
    } finally {
      setSending(false);
    }
  }
  //Scrollable chat thread displaying sent vs received message bubbles
  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
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
            <MessageCircle className="size-5 text-rose-600" />
            <h1 className="m-0 text-2xl font-semibold text-slate-950">Chat</h1>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </section>

        <section ref={messagesContainerRef} className="flex h-[75vh] min-h-[400px] max-h-[800px] flex-col gap-3 overflow-y-auto scroll-smooth rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-slate-500">
                Todavía no hay mensajes.
              </p>
            </div>
          ) : (
            [...messages]
              .sort(
                (a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              .map((message) => {
                const own = message.sender_id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={
                      own
                        ? "max-w-[80%] self-end rounded-lg bg-rose-600 px-4 py-2 text-white"
                        : "max-w-[80%] self-start rounded-lg bg-slate-100 px-4 py-2 text-slate-800"
                    }
                  >
                    <p className="wrap-break-word">
                      {message.body}
                    </p>

                    <p
                      className={
                        own
                          ? "mt-1 text-xs text-rose-100"
                          : "mt-1 text-xs text-slate-500"
                      }
                    >
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                );
              })
          )}
        </section>

        <form onSubmit={handleSend} className="flex gap-2">
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Escribe un mensaje" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-3" />
          <button disabled={sending || !body.trim()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 font-medium text-white disabled:opacity-60">
            <Send className="size-4" />
            Enviar
          </button>
        </form>
      </div>
    </main>
  );
}
