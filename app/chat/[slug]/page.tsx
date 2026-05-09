"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getProfileBySlug, sendChatMessage, getChatMessages, recordVisitor } from "@/lib/actions";
import { Profile, Chat } from "@/lib/supabase";
import { getVisitorToken } from "@/lib/visitor";

export default function ChatPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const visitorToken = getVisitorToken();

  useEffect(() => {
    async function loadData() {
      const p = await getProfileBySlug(slug);
      if (p) {
        setProfile(p);
        await recordVisitor(p.id, visitorToken);
        const msgs = await getChatMessages(p.id, visitorToken);
        setMessages(msgs);
      }
      setIsLoading(false);
    }
    loadData();
  }, [slug, visitorToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;

    setIsSending(true);
    try {
      const msg = await sendChatMessage(
        profile.id,
        visitorToken,
        "visitor",
        newMessage.trim()
      );
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send:", err);
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            主页不存在
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold">
            {profile.nickname.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">{profile.nickname}</h1>
          <p className="text-xs text-gray-500">匿名聊天</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>发送消息开始聊天</p>
            <p className="text-xs mt-1">你的身份默认匿名</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "visitor" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                msg.sender === "visitor"
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-white text-gray-900 rounded-bl-md shadow-sm"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.sender === "visitor"
                    ? "text-blue-100"
                    : "text-gray-400"
                }`}
              >
                {new Date(msg.created_at).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">
          你的身份默认匿名，主人无法看到你是谁
        </p>
      </div>
    </div>
  );
}
