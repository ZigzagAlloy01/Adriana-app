import { useState } from "react";
import { supabase } from "@/services/supabase";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  if (loading) return;

  setLoading(true);
  setError(null);

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/auth/login");
  } finally {
    setLoading(false);
  }
};

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
          ¿Ya tienes cuenta?{" "}
          <span
            className="text-pink-600 cursor-pointer"
            onClick={() => navigate("/auth/login")}
          >
            Inicia sesión
          </span>
        </p>
      </form>
    </div>
  );
}