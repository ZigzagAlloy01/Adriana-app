import { useState } from "react";
import { supabase } from "@/services/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  // Local state variables for capturing form inputs and managing registration status.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Asynchronous handler to register new users via Supabase auth.
  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  // Guard clause to prevent duplicate submit requests while loading.
  if (loading) return;

  setLoading(true);
  setError(null);

  try {
    // Calls Supabase Authentication API to create a new user credentials record.
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
      return;
    }
    // Redirect user to the login route upon successful registration.
    navigate("/auth/login");
  } finally {
    // Ensures loading state resets even if the network call fails.
    setLoading(false);
  }
};
  // Styled user registration card interface using Tailwind CSS utility classes.
  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm p-6 bg-white rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">
          Crear cuenta ❤️
        </h1>

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
          disabled={loading} type="submit"
          className="w-full bg-black text-white p-2 rounded hover:bg-gray-800"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <p className="text-sm text-center">
          <span>¿Ya tienes cuenta? </span>
          <Link
            to="/auth/login"
            className="text-pink-600 cursor-pointer"
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}