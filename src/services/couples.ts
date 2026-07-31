import { supabase } from "@/services/supabase";
import { normalizeInviteCode } from "@/services/helpers";
// Invokes RPC function to initialize a new couple entity along with an active invitation code.
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
// Binds the current user to an existing couple using a normalized invite code via RPC
export async function joinCouple(code: string) {
  const inviteCode = normalizeInviteCode(code);
  if (!inviteCode) throw new Error("Ingresa un codigo de invitacion.");

  const { data, error } = await supabase.rpc("join_couple_by_code", {
    p_code: inviteCode,
  });

  if (error) throw error;
  return data;
}
// Generates a new invitation record for an existing couple via RPC.
export async function createInvitation() {
  const { data, error } = await supabase.rpc("create_invitation");
  if (error) throw error;
  return data;
}
// Registers a new user account with Supabase Auth and stores default metadata.
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
// Authenticates user credentials via Supabase email and password login.
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}
// Retrieves active session user object from Supabase Auth.
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
// Fetches linked couple ID for the current user via RPC.
export async function getMyCouple() {
  const { data, error } = await supabase.rpc("get_my_couple_id");
  if (error) return null;
  return data;
}
// Sanitizes partial update parameters and updates couple settings in the database.
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
    // Cleans empty strings and undefined fields prior to sending update payload.
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
      .update(cleanValues as any)
      .eq("id", coupleId)
      .select()
      .single();

    if (error) throw error;

    return data;
}

export async function updateUserProfile(display_name: string) {
  const { data: { user }, error: userError} = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not authenticated.")

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: display_name.trim(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  
  return data;
}