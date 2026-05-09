"use server";

import { supabase, Profile, Message, MessageWithReveal, Visitor, Chat } from "./supabase";
import { generateSlug } from "./utils";
import { revalidatePath } from "next/cache";

// Create a new profile
export async function createProfile(
  nickname: string,
  bio: string
): Promise<Profile> {
  const slug = generateSlug();

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      nickname,
      bio,
      slug,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return data;
}

// Get profile by slug
export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Create a new message
export async function createMessage(
  profileId: string,
  content: string,
  mode: "anonymous" | "revealable",
  revealProfile?: {
    nickname: string;
    contact_hint: string;
    intro: string;
  }
): Promise<Message> {
  // Create the message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      profile_id: profileId,
      content,
      mode,
    })
    .select()
    .single();

  if (messageError) {
    throw new Error(`Failed to create message: ${messageError.message}`);
  }

  // If mode is revealable, create the reveal profile
  if (mode === "revealable" && revealProfile) {
    const { error: revealError } = await supabase
      .from("reveal_profiles")
      .insert({
        message_id: message.id,
        nickname: revealProfile.nickname,
        contact_hint: revealProfile.contact_hint,
        intro: revealProfile.intro,
      });

    if (revealError) {
      throw new Error(
        `Failed to create reveal profile: ${revealError.message}`
      );
    }
  }

  return message;
}

// Get dashboard data for a profile
export async function getDashboardData(
  profileId: string
): Promise<{ profile: Profile; messages: MessageWithReveal[] }> {
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError) {
    throw new Error(`Failed to get profile: ${profileError.message}`);
  }

  // Get messages with reveal profiles
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select(
      `
      *,
      reveal_profiles (*)
    `
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (messagesError) {
    throw new Error(`Failed to get messages: ${messagesError.message}`);
  }

  return {
    profile,
    messages: messages || [],
  };
}

// Mock reveal a message (simulate payment)
export async function mockRevealMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ revealed: true })
    .eq("id", messageId);

  if (error) {
    throw new Error(`Failed to reveal message: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

// Check if slug exists
export async function checkSlugExists(slug: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .single();

  return !!data;
}

// Record a visitor
export async function recordVisitor(
  profileId: string,
  visitorToken: string
): Promise<void> {
  // Check if visitor already exists
  const { data: existing } = await supabase
    .from("visitors")
    .select("id")
    .eq("profile_id", profileId)
    .eq("visitor_token", visitorToken)
    .single();

  if (!existing) {
    const { error } = await supabase.from("visitors").insert({
      profile_id: profileId,
      visitor_token: visitorToken,
    });

    if (error) {
      console.error("Failed to record visitor:", error);
    }
  }
}

// Get visitors for a profile
export async function getVisitors(
  profileId: string
): Promise<Visitor[]> {
  const { data, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get visitors: ${error.message}`);
  }

  return data || [];
}

// Mock reveal a visitor (simulate payment)
export async function mockRevealVisitor(visitorId: string): Promise<void> {
  const { error } = await supabase
    .from("visitors")
    .update({ revealed: true })
    .eq("id", visitorId);

  if (error) {
    throw new Error(`Failed to reveal visitor: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

// Send a chat message
export async function sendChatMessage(
  profileId: string,
  visitorToken: string,
  sender: "owner" | "visitor",
  content: string
): Promise<Chat> {
  const { data, error } = await supabase
    .from("chats")
    .insert({
      profile_id: profileId,
      visitor_token: visitorToken,
      sender,
      content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data;
}

// Get chat messages
export async function getChatMessages(
  profileId: string,
  visitorToken: string
): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("profile_id", profileId)
    .eq("visitor_token", visitorToken)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data || [];
}

// Get all chats for a profile (for dashboard)
export async function getAllChats(
  profileId: string
): Promise<{ visitor_token: string; last_message: string; created_at: string }[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("visitor_token, content, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get chats: ${error.message}`);
  }

  // Group by visitor_token and get last message
  const chatsMap = new Map();
  (data || []).forEach((chat) => {
    if (!chatsMap.has(chat.visitor_token)) {
      chatsMap.set(chat.visitor_token, {
        visitor_token: chat.visitor_token,
        last_message: chat.content,
        created_at: chat.created_at,
      });
    }
  });

  return Array.from(chatsMap.values());
}
