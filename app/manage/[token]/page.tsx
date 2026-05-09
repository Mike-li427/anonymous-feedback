"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getDashboardDataByToken, revealVisitor } from "@/lib/actions";
import { formatRelativeTime, getBaseUrl } from "@/lib/utils";

const QRCodeSVG = dynamic(() => import("qrcode.react").then(mod => mod.QRCodeSVG), { ssr: false });

export default function ManageDashboard() {
  const params = useParams();
  const token = params.token as string;

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [chats, setChats] = useState<{ visitor_token: string; last_message: string; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"messages" | "visitors" | "chats">("messages");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDashboardDataByToken(token);
        setProfile(data.profile);
        setMessages(data.messages);
        setVisitors(data.visitors);
        setChats(data.chats);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [token]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const handleRevealVisitor = async (visitorId: string) => {
    try {
      await revealVisitor(visitorId);
      setVisitors((prev) => prev.map((v) => (v.id === visitorId ? { ...v, revealed: true } : v)));
    } catch {}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">管理链接无效</h1>
          <p className="text-gray-500">请检查链接是否正确</p>
        </div>
      </div>
    );
  }

  const publicUrl = `${getBaseUrl()}/u/${profile.slug}`;

  return (
    <div className="min-h-screen p-4 pt-8 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">管理后台</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.nickname}</h1>
            {profile.bio && <p className="text-gray-500 text-sm mt-1">{profile.bio}</p>}
          </div>
          <Link
            href={`/u/${profile.slug}`}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-all"
          >
            查看主页
          </Link>
        </div>

        {/* Share Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800">公开主页链接</span>
            <button
              onClick={() => copyToClipboard(publicUrl, "share")}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              {copied === "share" ? "已复制" : "复制"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {publicUrl && <QRCodeSVG value={publicUrl} size={80} />}
            </div>
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 truncate"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            <p className="text-xs text-gray-400 mt-1">留言</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{visitors.length}</p>
            <p className="text-xs text-gray-400 mt-1">访客</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
            <p className="text-xs text-gray-400 mt-1">聊天</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["messages", "visitors", "chats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "messages" ? `留言 (${messages.length})` : tab === "visitors" ? `访客 (${visitors.length})` : `聊天 (${chats.length})`}
            </button>
          ))}
        </div>

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-400">还没有收到留言</p>
                <p className="text-xs text-gray-300 mt-1">分享你的主页链接给朋友们吧</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <p className="text-gray-900">{message.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(message.createdAt)}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {message.mode === "anonymous" ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="text-sm">完全匿名，无法查看身份</span>
                      </div>
                    ) : message.revealed ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">已解锁身份</span>
                        </div>
                        {message.revealProfile && (
                          <div className="bg-emerald-50 rounded-xl p-3 space-y-1">
                            <p className="text-sm"><span className="font-medium">昵称：</span>{message.revealProfile.nickname}</p>
                            {message.revealProfile.contactHint && <p className="text-sm"><span className="font-medium">联系方式：</span>{message.revealProfile.contactHint}</p>}
                            {message.revealProfile.intro && <p className="text-sm"><span className="font-medium">介绍：</span>{message.revealProfile.intro}</p>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={`/pay/${message.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        ¥5.20 解锁身份
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Visitors Tab */}
        {activeTab === "visitors" && (
          <div className="space-y-3">
            {visitors.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-400">还没有访客</p>
              </div>
            ) : (
              visitors.map((visitor) => (
                <div key={visitor.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{visitor.revealed ? (visitor.nickname || "匿名用户") : "匿名访客"}</p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(visitor.createdAt)}</p>
                    </div>
                  </div>
                  {!visitor.revealed && (
                    <button
                      onClick={() => handleRevealVisitor(visitor.id)}
                      className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-all"
                    >
                      解锁
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && (
          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-400">还没有聊天</p>
              </div>
            ) : (
              chats.map((chat) => (
                <Link
                  key={chat.visitor_token}
                  href={`/chat/${profile.slug}?owner=true`}
                  className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{chat.last_message}</p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(chat.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
