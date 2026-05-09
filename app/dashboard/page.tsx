"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getDashboardData, getVisitors, getAllChats, mockRevealVisitor } from "@/lib/actions";
import { Profile, MessageWithReveal, Visitor } from "@/lib/supabase";
import { formatRelativeTime, getBaseUrl } from "@/lib/utils";

const QRCodeSVG = dynamic(() => import("qrcode.react").then(mod => mod.QRCodeSVG), { ssr: false });

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<MessageWithReveal[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [chats, setChats] = useState<{ visitor_token: string; last_message: string; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "visitors" | "chats">("messages");

  useEffect(() => {
    const profileId = localStorage.getItem("profileId");
    if (!profileId) {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const data = await getDashboardData(profileId!);
        setProfile(data.profile);
        setMessages(data.messages);

        const visitorsData = await getVisitors(profileId!);
        setVisitors(visitorsData);

        const chatsData = await getAllChats(profileId!);
        setChats(chatsData);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

  const profileUrl = profile
    ? `${getBaseUrl()}/u/${profile.slug}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleRevealVisitor = async (visitorId: string) => {
    try {
      await mockRevealVisitor(visitorId);
      setVisitors((prev) =>
        prev.map((v) => (v.id === visitorId ? { ...v, revealed: true } : v))
      );
    } catch (err) {
      console.error("Failed to reveal visitor:", err);
    }
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
            未找到主页
          </h1>
          <p className="text-gray-600 mb-4">请先创建你的匿名主页</p>
          <Link
            href="/"
            className="inline-block py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            创建主页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">我的后台</h1>
          <p className="text-gray-600">
            分享你的匿名主页，接收朋友们的匿名留言
          </p>
        </div>

        {/* Profile Link Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">你的匿名主页链接</h2>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={profileUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
            >
              {copied ? "已复制" : "复制"}
            </button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center pt-4">
            <div className="p-4 bg-white border rounded-lg">
              {profileUrl && <QRCodeSVG value={profileUrl} size={192} />}
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            分享此链接或二维码，让朋友们匿名给你留言
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">
            留言列表 ({messages.length})
          </h2>

          {messages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-500">还没有收到留言</p>
              <p className="text-sm text-gray-400 mt-1">
                分享你的主页链接给朋友们吧
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="bg-white rounded-xl shadow-sm border p-4 space-y-3"
                >
                  {/* Message Content */}
                  <p className="text-gray-900">{message.content}</p>

                  {/* Time */}
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(message.created_at)}
                  </p>

                  {/* Reveal Status */}
                  <div className="pt-2 border-t">
                    {message.mode === "anonymous" ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        <span className="text-sm">完全匿名，无法查看身份</span>
                      </div>
                    ) : message.revealed ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            已解锁身份
                          </span>
                        </div>
                        {message.reveal_profiles && (
                          <div className="bg-green-50 p-3 rounded-lg space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">昵称：</span>
                              {message.reveal_profiles.nickname}
                            </p>
                            {message.reveal_profiles.contact_hint && (
                              <p className="text-sm">
                                <span className="font-medium">
                                  联系方式提示：
                                </span>
                                {message.reveal_profiles.contact_hint}
                              </p>
                            )}
                            {message.reveal_profiles.intro && (
                              <p className="text-sm">
                                <span className="font-medium">介绍：</span>
                                {message.reveal_profiles.intro}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-orange-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <span className="text-sm">可解锁身份</span>
                        </div>
                        <Link
                          href={`/pay/${message.id}`}
                          className="px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-all"
                        >
                          5.2 元查看
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl shadow-sm border p-2">
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "messages"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            留言 ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab("visitors")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "visitors"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            访客 ({visitors.length})
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "chats"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            聊天 ({chats.length})
          </button>
        </div>

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">
              留言列表 ({messages.length})
            </h2>

            {messages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <p className="text-gray-500">还没有收到留言</p>
                <p className="text-sm text-gray-400 mt-1">
                  分享你的主页链接给朋友们吧
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-white rounded-xl shadow-sm border p-4 space-y-3"
                  >
                    {/* Message Content */}
                    <p className="text-gray-900">{message.content}</p>

                    {/* Time */}
                    <p className="text-xs text-gray-400">
                      {formatRelativeTime(message.created_at)}
                    </p>

                    {/* Reveal Status */}
                    <div className="pt-2 border-t">
                      {message.mode === "anonymous" ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                          <span className="text-sm">完全匿名，无法查看身份</span>
                        </div>
                      ) : message.revealed ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-sm font-medium">
                              已解锁身份
                            </span>
                          </div>
                          {message.reveal_profiles && (
                            <div className="bg-green-50 p-3 rounded-lg space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">昵称：</span>
                                {message.reveal_profiles.nickname}
                              </p>
                              {message.reveal_profiles.contact_hint && (
                                <p className="text-sm">
                                  <span className="font-medium">
                                    联系方式提示：
                                  </span>
                                  {message.reveal_profiles.contact_hint}
                                </p>
                              )}
                              {message.reveal_profiles.intro && (
                                <p className="text-sm">
                                  <span className="font-medium">介绍：</span>
                                  {message.reveal_profiles.intro}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-orange-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <span className="text-sm">可解锁身份</span>
                          </div>
                          <Link
                            href={`/pay/${message.id}`}
                            className="px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-all"
                          >
                            5.2 元查看
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Visitors Tab */}
        {activeTab === "visitors" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">
              访客列表 ({visitors.length})
            </h2>

            {visitors.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <p className="text-gray-500">还没有访客</p>
                <p className="text-sm text-gray-400 mt-1">
                  分享你的主页链接给朋友们吧
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="bg-white rounded-xl shadow-sm border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          {visitor.revealed ? (
                            <p className="font-medium text-gray-900">
                              {visitor.nickname || "匿名用户"}
                            </p>
                          ) : (
                            <p className="font-medium text-gray-500">
                              匿名访客
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {formatRelativeTime(visitor.created_at)}
                          </p>
                        </div>
                      </div>

                      {!visitor.revealed && (
                        <button
                          onClick={() => handleRevealVisitor(visitor.id)}
                          className="px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-all"
                        >
                          5.2 元解锁
                        </button>
                      )}
                    </div>

                    {visitor.revealed && visitor.contact_info && (
                      <div className="mt-3 pt-3 border-t bg-green-50 p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">联系方式：</span>
                          {visitor.contact_info}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">
              聊天列表 ({chats.length})
            </h2>

            {chats.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <p className="text-gray-500">还没有聊天</p>
                <p className="text-sm text-gray-400 mt-1">
                  分享你的主页链接，访客可以匿名聊天
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chats.map((chat) => (
                  <Link
                    key={chat.visitor_token}
                    href={`/chat/${profile?.slug}?owner=true`}
                    className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {chat.last_message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(chat.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create New Profile */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            创建新的匿名主页
          </Link>
        </div>
      </div>
    </div>
  );
}
