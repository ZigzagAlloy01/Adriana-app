import { useEffect, useState } from "react";
import AppRouter from "./routes/AppRouter";
import { useAuthStore } from "./store/authStore";
import { useCoupleStore } from "./store/coupleStore";
// Root application component managing initial authentication and store hydration sequence.
function App() {
  const initAuth = useAuthStore((state) => state.init);
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
  const [booting, setBooting] = useState(true);
  // Bootstraps core authentication session and retrieves linked couple profile on mount.
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
  // Full-screen fallback loader shown during initial application state hydration.
  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <p className="text-slate-500">Cargando historia de pareja</p>
      </div>
    );
  }
  // Renders core application router once global stores are initialized.
  return <AppRouter />;
}

export default App;
