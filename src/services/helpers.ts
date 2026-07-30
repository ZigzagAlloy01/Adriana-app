import { supabase } from "@/services/supabase";
// Extracts user-friendly error messages from unknown catch blocks with fallback support.
export function getErrorMessage(error: unknown, fallback = "Ocurrio un error inesperado") {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
// Asserts active user authentication and retrieves user ID or throws error.
export async function requireCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Necesitas iniciar sesion.");
  return data.user.id;
}
// Sanitizes invite code strings by removing special characters and converting to uppercase.
export function normalizeInviteCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}
