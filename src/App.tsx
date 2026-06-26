import { useEffect, useState } from "react";
import AppRouter from "./routes/AppRouter";
import { useCoupleStore } from "./store/coupleStore";
import { useAuthStore } from "./store/authStore";

function App() {
  const initAuth = useAuthStore((s) => s.init);
  const fetchCouple = useCoupleStore((s) => s.fetchCouple);

  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initAuth();
        await fetchCouple();
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, []);

  // 🔥 pantalla de carga global (evita flashes de UI)
  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <p className="text-gray-500">Cargando historia de pareja ❤️</p>
      </div>
    );
  }

  return <AppRouter />;
}

export default App;