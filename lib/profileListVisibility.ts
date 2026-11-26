import { supabase } from "./supabase";

export type ProfileList = "awards" | "friends" | "teams";
export type ProfileListVisibility = Record<ProfileList, boolean>;

export async function getProfileListVisibility(userId: string): Promise<ProfileListVisibility> {
  const { data, error } = await supabase.from("profile_list_visibility")
    .select("awards,friends,teams").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { awards: true, friends: true, teams: true };
  if (typeof data.awards !== "boolean" || typeof data.friends !== "boolean" || typeof data.teams !== "boolean") {
    throw new Error("Profile list visibility is invalid.");
  }
  return data;
}

export async function setProfileListVisibility(list: ProfileList, visible: boolean): Promise<void> {
  const { error } = await supabase.rpc("gb_set_profile_list_visibility", { p_list: list, p_public: visible });
  if (error) throw new Error(error.message);
}
