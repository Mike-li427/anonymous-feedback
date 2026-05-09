"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProfileBySlug, createMessage, recordVisitor } from "@/lib/actions";
import { getVisitorToken } from "@/lib/visitor";

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<any>(null);
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
      if (p) recordVisitor(p.id, getVisitorToken());
    }
    loadProfile();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!content.trim()) { setError("请输入留言内容"); return; }
    if (mode === "revealable" && !nickname.trim()) { setError("请填写昵称"); return; }
    setIsSubmitting(true);
    try {
      await createMessage(
        profile!.id,
        content.trim(),
        mode,
        mode === "revealable" ? { nickname: nickname.trim(), contact_hint: contactHint.trim(), intro: intro.trim() } : undefined
      );
      router.push(`/sent?slug=${slug}`);
    } catch {
      setError("提交失败，请重试");
      setIsSubmitting(false);
    }
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
          <p className="text-gray-500">该用户主页可能已被删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-violet-50" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-violet-200/20 via-sky-200/10 to-transparent rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <span className="text-3xl font-bold text-white">{profile.nickname.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.nickname}</h1>
          {profile.bio && <p className="text-gray-500 mt-1">{profile.bio}</p>}
        </div>

        {/* Message Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/60 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-800 mb-2">给 TA 留一句匿名话</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你想说的话..."
                rows={4}
                className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                maxLength={500}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-800">留言模式</label>
              <div className="space-y-2">
                {[
                  { value: "anonymous" as const, title: "完全匿名", desc: "不会留下任何可查看的身份信息", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
                  { value: "revealable" as const, title: "匿名留言 + 允许解锁身份", desc: "主页主人付费后可查看你填写的身份卡", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      mode === option.value ? "border-violet-500 bg-violet-50/50" : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={mode === option.value}
                      onChange={() => setMode(option.value)}
                      className="mt-1 mr-3 accent-violet-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.title}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {mode === "revealable" && (
              <div className="space-y-4 p-4 bg-violet-50/50 rounded-2xl border border-violet-100">
                <p className="text-sm text-violet-700 font-medium">填写身份卡信息（仅在对方付费后可见）</p>
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">昵称 *</label>
                  <input type="text" id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="你想让对方知道的昵称" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none" maxLength={20} />
                </div>
                <div>
                  <label htmlFor="contactHint" className="block text-sm font-medium text-gray-700 mb-1">联系方式提示</label>
                  <input type="text" id="contactHint" value={contactHint} onChange={(e) => setContactHint(e.target.value)} placeholder="例如：同班同学、微信名是..." className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none" maxLength={50} />
                </div>
                <div>
                  <label htmlFor="intro" className="block text-sm font-medium text-gray-700 mb-1">一句自我介绍</label>
                  <textarea id="intro" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="简单介绍一下自己" rows={2} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none resize-none" maxLength={100} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-xl text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-sky-600 text-white font-semibold rounded-2xl hover:from-violet-700 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
            >
              {isSubmitting ? "提交中..." : "提交留言"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>完全匿名留言不会留下可查看身份；只有你主动选择可解锁身份卡，主页主人才可查看</p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium">
            我也要创建匿名主页
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
