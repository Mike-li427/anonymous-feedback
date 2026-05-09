"use server";

import { supabase, Profile, Message, MessageWithReveal, Visitor, Chat, PaymentOrder } from "./supabase";
import { generateSlug, generateOwnerToken } from "./utils";
import { revalidatePath } from "next/cache";

export async function createProfile(
  nickname: string,
  bio: string
): Promise<{ profile: Profile; ownerToken: string }> {
  const slug = generateSlug();
  const ownerToken = generateOwnerToken();

  const { data, error } = await supabase
    .from("profiles")
    .insert({ nickname, bio, slug, owner_token: ownerToken })
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return { profile: data, ownerToken };
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function getProfileByOwnerToken(ownerToken: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("owner_token", ownerToken)
    .single();

  if (error) return null;
  return data;
}

export async function createMessage(
  profileId: string,
  content: string,
  mode: "anonymous" | "revealable",
  revealProfile?: { nickname: string; contact_hint: string; intro: string }
): Promise<Message> {
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({ profile_id: profileId, content, mode })
    .select()
    .single();

  if (messageError) throw new Error(`Failed to create message: ${messageError.message}`);

  if (mode === "revealable" && revealProfile) {
    const { error: revealError } = await supabase
      .from("reveal_profiles")
      .insert({ message_id: message.id, ...revealProfile });

    if (revealError) throw new Error(`Failed to create reveal profile: ${revealError.message}`);
  }

  return message;
}

export async function getDashboardDataByToken(
  ownerToken: string
): Promise<{ profile: Profile; messages: MessageWithReveal[]; visitors: Visitor[]; chats: { visitor_token: string; last_message: string; created_at: string }[] }> {
  const profile = await getProfileByOwnerToken(ownerToken);
  if (!profile) throw new Error("Profile not found");

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*, reveal_profiles (*)")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (messagesError) throw new Error(`Failed to get messages: ${messagesError.message}`);

  const { data: visitors, error: visitorsError } = await supabase
    .from("visitors")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (visitorsError) throw new Error(`Failed to get visitors: ${visitorsError.message}`);

  const { data: chatsData, error: chatsError } = await supabase
    .from("chats")
    .select("visitor_token, content, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (chatsError) throw new Error(`Failed to get chats: ${chatsError.message}`);

  const chatsMap = new Map();
  (chatsData || []).forEach((chat) => {
    if (!chatsMap.has(chat.visitor_token)) {
      chatsMap.set(chat.visitor_token, {
        visitor_token: chat.visitor_token,
        last_message: chat.content,
        created_at: chat.created_at,
      });
    }
  });

  return {
    profile,
    messages: messages || [],
    visitors: visitors || [],
    chats: Array.from(chatsMap.values()),
  };
}

export async function recordVisitor(profileId: string, visitorToken: string): Promise<void> {
  const { data: existing } = await supabase
    .from("visitors")
    .select("id")
    .eq("profile_id", profileId)
    .eq("visitor_token", visitorToken)
    .single();

  if (!existing) {
    await supabase.from("visitors").insert({ profile_id: profileId, visitor_token: visitorToken });
  }
}

export async function sendChatMessage(
  profileId: string,
  visitorToken: string,
  sender: "owner" | "visitor",
  content: string
): Promise<Chat> {
  const { data, error } = await supabase
    .from("chats")
    .insert({ profile_id: profileId, visitor_token: visitorToken, sender, content })
    .select()
    .single();

  if (error) throw new Error(`Failed to send message: ${error.message}`);
  return data;
}

export async function getChatMessages(profileId: string, visitorToken: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("profile_id", profileId)
    .eq("visitor_token", visitorToken)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get messages: ${error.message}`);
  return data || [];
}

export async function createPaymentOrder(messageId: string, profileId: string): Promise<PaymentOrder> {
  const { data: existing } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("message_id", messageId)
    .eq("status", "pending")
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("payment_orders")
    .insert({ message_id: messageId, profile_id: profileId, amount: 520, provider: "wechat" })
    .select()
    .single();

  if (error) throw new Error(`Failed to create payment order: ${error.message}`);
  return data;
}

export async function getPaymentOrder(orderId: string): Promise<PaymentOrder | null> {
  const { data, error } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data;
}

export async function getPaymentOrderByMessage(messageId: string): Promise<PaymentOrder | null> {
  const { data, error } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function confirmPayment(orderId: string): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw new Error("Order not found");
  if (order.status === "paid") return;

  const { error: updateOrderError } = await supabase
    .from("payment_orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updateOrderError) throw new Error(`Failed to update order: ${updateOrderError.message}`);

  const { error: updateMessageError } = await supabase
    .from("messages")
    .update({ revealed: true })
    .eq("id", order.message_id);

  if (updateMessageError) throw new Error(`Failed to reveal message: ${updateMessageError.message}`);
}

export async function revealVisitor(visitorId: string): Promise<void> {
  const { error } = await supabase
    .from("visitors")
    .update({ revealed: true })
    .eq("id", visitorId);

  if (error) throw new Error(`Failed to reveal visitor: ${error.message}`);
}
