import { supabase } from "@/services/supabase";
import { v4 as uuidv4 } from "uuid";

export async function createCouple(userId: string) {
  const { data: couple, error } = await supabase
    .from("couples")
    .insert({})
    .select()
    .single();

  if (error) throw error;

  await supabase.from("couple_members").insert({
    couple_id: couple.id,
    user_id: userId,
  });

  const code = uuidv4().slice(0, 8);

  await supabase.from("invitations").insert({
    couple_id: couple.id,
    code,
    expires_at: null,
  });

  return code;
}

export async function joinCouple(userId: string, code: string) {
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !invitation) {
    throw new Error("Código inválido");
  }

  const { data: existing } = await supabase
    .from("couple_members")
    .select("*")
    .eq("user_id", userId)
    .eq("couple_id", invitation.couple_id)
    .maybeSingle();

  if (existing) {
    return invitation.couple_id;
  }

  await supabase.from("couple_members").insert({
    couple_id: invitation.couple_id,
    user_id: userId,
  });

  return invitation.couple_id;
}

export async function signUp(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getMyCouple() {
  const { data, error } = await supabase
    .from("couple_members")
    .select("couple_id")
    .single();

  if (error) return null;

  return data.couple_id;
}