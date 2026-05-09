"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProfileBySlug, createMessage, recordVisitor } from "@/lib/actions";
import { Profile } from "@/lib/supabase";
import { getVisitorToken } from "@/lib/visitor";

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"anonymous" | "revealable">("anonymous");
  const [nickname, setNickname] = useState("");
  const [contactHint, setContactHint] = useState("");
  const [intro, setIntro] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const p = await getProfileBySlug(slug);
      setProfile(p);
      setIsLoading(false);
      if (p) {
        recordVisitor(p.id, getVisitorToken());
      }
    }
    loadProfile();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("请输入留言内容");
      return;
    }

    if (mode === "revealable" && !nickname.trim()) {
      setError("请填写昵称");
      return;
    }

    setIsSubmitting(true);

    try {
      await createMessage(
        profile!.id,
        content.trim(),
        mode,
        mode === "revealable"
          ? {
              nickname: nickname.trim(),
              contact_hint: contactHint.trim(),
              intro: intro.trim(),
            }
          : undefined
      );
      router.push(`/sent?slug=${slug}`);
    } catch (err) {
      setError("提交失败，请重试");
      setIsSubmitting(false);
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
            主页不存在
          </h1>
          <p className="text-gray-600">该用户主页可能已被删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-12">
      <div className="w-full max-w-md space-y-8">
        {/* Profile Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">
              {profile.nickname.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.nickname}
          </h1>
          {profile.bio && (
            <p className="text-gray-600">{profile.bio}</p>
          )}
        </div>

        {/* Message Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              给 TA 留一句匿名话
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你想说的话..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              maxLength={500}
            />
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              留言模式
            </label>
            <div className="space-y-3">
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  mode === "anonymous"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="anonymous"
                  checked={mode === "anonymous"}
                  onChange={() => setMode("anonymous")}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">完全匿名</div>
                  <div className="text-sm text-gray-500">
                    不会留下任何可查看的身份信息
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  mode === "revealable"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="revealable"
                  checked={mode === "revealable"}
                  onChange={() => setMode("revealable")}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    匿名留言 + 允许解锁身份
                  </div>
                  <div className="text-sm text-gray-500">
                    主页主人付费后可查看你填写的身份卡
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Reveal Profile Form */}
          {mode === "revealable" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                填写身份卡信息（仅在对方付费后可见）
              </p>
              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  昵称 *
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你想让对方知道的昵称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  maxLength={20}
                />
              </div>
              <div>
                <label
                  htmlFor="contactHint"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  联系方式提示
                </label>
                <input
                  type="text"
                  id="contactHint"
                  value={contactHint}
                  onChange={(e) => setContactHint(e.target.value)}
                  placeholder="例如：同班同学、微信名是..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  maxLength={50}
                />
              </div>
              <div>
                <label
                  htmlFor="intro"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  一句自我介绍
                </label>
                <textarea
                  id="intro"
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="简单介绍一下自己"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "提交中..." : "提交留言"}
          </button>
        </form>

        {/* Chat Button */}
        <Link
          href={`/chat/${slug}`}
          className="block w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all text-center"
        >
          匿名聊天
        </Link>

        {/* Privacy Notice */}
        <div className="text-center text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
          <p className="font-medium mb-1">隐私说明</p>
          <p>
            完全匿名留言不会留下可查看身份；只有你主动选择可解锁身份卡，主页主人支付后才可查看你填写的信息。
          </p>
        </div>
      </div>
    </div>
  );
}
