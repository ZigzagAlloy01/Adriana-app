import type { Memory } from "@/types/dashboard";

type Props = {
  memories: Memory[];
};

export default function MemoriesPreview({ memories }: Props) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow space-y-2">
      <h2 className="font-semibold">Recuerdos</h2>

      <div className="flex flex-wrap gap-2">
        {memories.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Aún no hay recuerdos
          </p>
        ) : (
          memories.map((m) => (
            <span
              key={m.id}
              className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm"
            >
              {m.title}
            </span>
          ))
        )}
      </div>
    </div>
  );
}