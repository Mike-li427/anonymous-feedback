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
      const msg = await sendChatMessage(profile.id, visitorToken, "visitor", newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch {}
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          加载中...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">主页不存在</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-sky-500 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-white">{profile.nickname.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">{profile.nickname}</h1>
          <p className="text-xs text-gray-400">匿名聊天</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>发送消息开始聊天</p>
            <p className="text-xs mt-1">你的身份默认匿名</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
              msg.sender === "visitor"
                ? "bg-gradient-to-r from-violet-600 to-sky-600 text-white rounded-br-md"
                : "bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100"
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.sender === "visitor" ? "text-white/60" : "text-gray-400"}`}>
                {new Date(msg.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200 p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-violet-500/30 focus:bg-white transition-all"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-sky-600 text-white rounded-full font-medium hover:from-violet-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            发送
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">你的身份默认匿名，主人无法看到你是谁</p>
      </div>
    </div>
  );
}
