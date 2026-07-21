import { supabase } from "@/services/supabase";

export function getErrorMessage(error: unknown, fallback = "Ocurrio un error inesperado") {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export async function requireCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Necesitas iniciar sesion.");
  return data.user.id;
}

export function normalizeInviteCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}
