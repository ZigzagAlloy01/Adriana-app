import { useState } from "react";
import { supabase } from "@/services/supabase";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
//A React Hook is a special JavaScript function that allows developers to use React features directly inside functional components.
export default function Login() {
  const navigate = useNavigate();
  // Fetch Zustand global actions to sync user and couple state after login.
  const initAuth = useAuthStore((state) => state.init);
  const { fetchCouple } = useCoupleStore();
  
  // Local state to manage form inputs and UI feedback during authentication.
  //useState is a built-in React Hook that lets functional components manage and store dynamic state data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Asynchronous function handling the core login flow and preventing duplicate submissions.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    // Authenticate the user securely directly against the Supabase backend.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Sync global stores with backend data before redirecting to the dashboard.
    await initAuth();
    await fetchCouple();

    setLoading(false);
    navigate("/");
  };
  // Renders a responsive, Tailwind-styled login card with dynamic error handling.
  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-6 bg-white rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Iniciar sesión ❤️</h1>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Correo"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full bg-pink-500 text-white p-2 rounded hover:bg-pink-600"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-sm text-center">
          <span>¿No tienes cuenta? </span>
          <Link
            to="/auth/register"
            className="text-pink-600 cursor-pointer"
          >
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}