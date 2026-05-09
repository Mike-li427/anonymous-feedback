"use server";

import { prisma } from "./db";
import { generateSlug, generateOwnerToken } from "./utils";
import { revalidatePath } from "next/cache";

export async function createProfile(
  nickname: string,
  bio: string
) {
  const slug = generateSlug();
  const ownerToken = generateOwnerToken();

  const profile = await prisma.profile.create({
    data: { nickname, bio, slug, ownerToken },
  });

  return { profile, ownerToken };
}

export async function getProfileBySlug(slug: string) {
  return prisma.profile.findUnique({ where: { slug } });
}

export async function getProfileByOwnerToken(ownerToken: string) {
  return prisma.profile.findUnique({ where: { ownerToken } });
}

export async function createMessage(
  profileId: string,
  content: string,
  mode: "anonymous" | "revealable",
  revealProfile?: { nickname: string; contact_hint: string; intro: string }
) {
  const message = await prisma.message.create({
    data: { profileId, content, mode },
  });

  if (mode === "revealable" && revealProfile) {
    await prisma.revealProfile.create({
      data: {
        messageId: message.id,
        nickname: revealProfile.nickname,
        contactHint: revealProfile.contact_hint,
        intro: revealProfile.intro,
      },
    });
  }

  return message;
}

export async function getDashboardDataByToken(ownerToken: string) {
  const profile = await prisma.profile.findUnique({
    where: { ownerToken },
  });
  if (!profile) throw new Error("Profile not found");

  const messages = await prisma.message.findMany({
    where: { profileId: profile.id },
    include: { revealProfile: true },
    orderBy: { createdAt: "desc" },
  });

  const visitors = await prisma.visitor.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  const chatsData = await prisma.chat.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  const chatsMap = new Map();
  chatsData.forEach((chat) => {
    if (!chatsMap.has(chat.visitorToken)) {
      chatsMap.set(chat.visitorToken, {
        visitor_token: chat.visitorToken,
        last_message: chat.content,
        created_at: chat.createdAt.toISOString(),
      });
    }
  });

  return {
    profile,
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      revealProfile: m.revealProfile
        ? { ...m.revealProfile, createdAt: m.revealProfile.createdAt.toISOString() }
        : null,
    })),
    visitors: visitors.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })),
    chats: Array.from(chatsMap.values()),
  };
}

export async function getMessageById(messageId: string) {
  return prisma.message.findUnique({
    where: { id: messageId },
    include: { profile: true, revealProfile: true },
  });
}

export async function recordVisitor(profileId: string, visitorToken: string) {
  const existing = await prisma.visitor.findFirst({
    where: { profileId, visitorToken },
  });

  if (!existing) {
    await prisma.visitor.create({
      data: { profileId, visitorToken },
    });
  }
}

export async function sendChatMessage(
  profileId: string,
  visitorToken: string,
  sender: "owner" | "visitor",
  content: string
) {
  const chat = await prisma.chat.create({
    data: { profileId, visitorToken, sender, content },
  });
  return { ...chat, createdAt: chat.createdAt.toISOString() };
}

export async function getChatMessages(profileId: string, visitorToken: string) {
  const chats = await prisma.chat.findMany({
    where: { profileId, visitorToken },
    orderBy: { createdAt: "asc" },
  });
  return chats.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    created_at: c.createdAt.toISOString(),
  }));
}

export async function createPaymentOrder(messageId: string, profileId: string) {
  let resolvedProfileId = profileId;
  if (!resolvedProfileId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { profileId: true },
    });
    if (!message) {
      throw new Error("Message not found");
    }
    resolvedProfileId = message.profileId;
  }

  const existing = await prisma.paymentOrder.findFirst({
    where: { messageId, status: "pending" },
  });
  if (existing) return { ...existing, createdAt: existing.createdAt.toISOString(), paidAt: existing.paidAt?.toISOString() || null };

  const order = await prisma.paymentOrder.create({
    data: { messageId, profileId: resolvedProfileId, amount: 520, provider: "wechat" },
  });
  return { ...order, createdAt: order.createdAt.toISOString(), paidAt: order.paidAt?.toISOString() || null };
}

export async function getPaymentOrder(orderId: string) {
  const order = await prisma.paymentOrder.findUnique({ where: { id: orderId } });
  if (!order) return null;
  return { ...order, createdAt: order.createdAt.toISOString(), paidAt: order.paidAt?.toISOString() || null };
}

export async function getPaymentOrderByMessage(messageId: string) {
  const order = await prisma.paymentOrder.findFirst({
    where: { messageId },
    orderBy: { createdAt: "desc" },
  });
  if (!order) return null;
  return { ...order, createdAt: order.createdAt.toISOString(), paidAt: order.paidAt?.toISOString() || null };
}

export async function confirmPayment(orderId: string) {
  const order = await prisma.paymentOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status === "paid") return;

  await prisma.paymentOrder.update({
    where: { id: orderId },
    data: { status: "paid", paidAt: new Date() },
  });

  await prisma.message.update({
    where: { id: order.messageId },
    data: { revealed: true },
  });
}

export async function revealVisitor(visitorId: string) {
  await prisma.visitor.update({
    where: { id: visitorId },
    data: { revealed: true },
  });
}
