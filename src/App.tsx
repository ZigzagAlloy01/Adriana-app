import { useEffect, useState } from "react";
import AppRouter from "./routes/AppRouter";
import { useAuthStore } from "./store/authStore";
import { useCoupleStore } from "./store/coupleStore";

function App() {
  const initAuth = useAuthStore((state) => state.init);
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
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

    void bootstrap();
  }, [fetchCouple, initAuth]);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <p className="text-slate-500">Cargando historia de pareja</p>
      </div>
    );
  }

  return <AppRouter />;
}

export default App;
