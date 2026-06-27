function getDaysTogether(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

export default function DaysTogetherCard() {
  // temporal (luego viene de DB)
  const startDate = "2024-08-03";

  const days = getDaysTogether(startDate);

  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h2 className="text-sm text-gray-500">Días juntos</h2>
      <p className="text-3xl font-bold text-pink-500">
        {days} ❤️
      </p>
    </div>
  );
}