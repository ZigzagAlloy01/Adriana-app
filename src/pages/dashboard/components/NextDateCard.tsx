type Props = {
  event: any;
};

export default function NextDateCard({ event }: Props) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h2 className="text-sm text-gray-500">Próxima cita</h2>

      {event ? (
        <p className="text-lg font-semibold">
          {event.title} -{" "}
          {new Date(event.event_date).toLocaleString()}
        </p>
      ) : (
        <p className="text-gray-400">No hay citas próximas</p>
      )}
    </div>
  );
}