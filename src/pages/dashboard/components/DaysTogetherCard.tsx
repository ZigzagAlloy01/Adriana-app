// Helper function calculating elapsed days between start date and current date.
function getDaysTogether(startDate: string | null) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  // Converts millisecond differences into full 24-hour days using floor division.
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
}
// Visual widget displaying the calculated days together counter card.
export default function DaysTogetherCard({ startDate }: { startDate: string | null }) {
  // Computes active days counter based on couple anniversary or creation date.
  const days = getDaysTogether(startDate);

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="m-0 text-sm font-medium text-slate-500">Dias juntos</h2>
      <p className="mt-3 text-4xl font-semibold text-rose-600">{days}</p>
      <p className="mt-1 text-sm text-slate-500">Calculado desde la fecha de aniversario o creacion.</p>
    </section>
  );
}
