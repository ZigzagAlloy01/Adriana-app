import { supabase } from "@/services/supabase";
import { normalizeInviteCode } from "@/services/helpers";

export async function createCouple(anniversaryDate?: string | null, displayName?: string | null) {
  const { data, error } = await supabase.rpc("create_couple_with_invitation", {
    p_anniversary_date: anniversaryDate ?? null,
    p_display_name: displayName ?? null,
  });

  if (error) throw error;
  const result = data.at(0);
  if (!result) throw new Error("No se pudo crear la pareja.");
  return result.invitation_code;
}

export async function joinCouple(code: string) {
  const inviteCode = normalizeInviteCode(code);
  if (!inviteCode) throw new Error("Ingresa un codigo de invitacion.");

  const { data, error } = await supabase.rpc("join_couple_by_code", {
    p_code: inviteCode,
  });

  if (error) throw error;
  return data;
}

export async function createInvitation() {
  const { data, error } = await supabase.rpc("create_invitation");
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, displayName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
    },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getMyCouple() {
  const { data, error } = await supabase.rpc("get_my_couple_id");
  if (error) return null;
  return data;
}

export async function updateCouple(
    coupleId: string,
    values: Partial<{
      name: string;
      anniversary_date: string | null;
      cover_url: string | null;
      theme_color: string | null;
    }>
  )
    {
    
    const cleanValues: Record<string, any> = {
      ...values,
      name: values.name?.trim() === ""
        ? undefined
        : values.name?.trim(),
    };

    Object.keys(cleanValues).forEach((key) => {
      if (cleanValues[key] === undefined) {
        delete cleanValues[key];
      }
    })

    const { data, error } = await supabase
      .from("couples")
      .update(cleanValues)
      .eq("id", coupleId)
      .select()
      .single();

    if (error) throw error;

    return data;
}