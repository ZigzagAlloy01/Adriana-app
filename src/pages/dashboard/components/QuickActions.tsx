import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => navigate("/calendar")}
        className="bg-black text-white p-3 rounded-xl"
      >
        📅 Citas
      </button>

      <button
        onClick={() => navigate("/gallery")}
        className="bg-pink-500 text-white p-3 rounded-xl"
      >
        📸 Fotos
      </button>

      <button className="bg-white border p-3 rounded-xl">
        💌 Carta
      </button>

      <button className="bg-white border p-3 rounded-xl">
        🎯 Metas
      </button>
    </div>
  );
}