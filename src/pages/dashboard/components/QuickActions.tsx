import { Bell, CalendarDays, Camera, Goal, HeartHandshake, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "Citas", path: "/calendar", Icon: CalendarDays },
  { label: "Fotos", path: "/gallery", Icon: Camera },
  { label: "Recuerdos", path: "/memories", Icon: HeartHandshake },
  { label: "Mensajes", path: "/messages", Icon: MessageCircle },
  { label: "Cartas", path: "/letters", Icon: Mail },
  { label: "Metas", path: "/goals", Icon: Goal },
  { label: "Avisos", path: "/notifications", Icon: Bell },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {actions.map(({ label, path, Icon }) => (
        <button key={path} onClick={() => navigate(path)} className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700">
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </section>
  );
}
