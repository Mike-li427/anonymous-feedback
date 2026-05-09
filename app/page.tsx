"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProfile } from "@/lib/actions";

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nickname.trim()) {
      setError("请输入昵称");
      return;
    }
    setIsLoading(true);
    try {
      const { profile, ownerToken } = await createProfile(nickname.trim(), bio.trim());
      router.push(`/created?slug=${profile.slug}&token=${ownerToken}`);
    } catch (err: any) {
      setError(err.message || "创建失败，请重试");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-sky-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-200/30 via-sky-200/20 to-transparent rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100/60 text-violet-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
            匿名互动
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            来匿名评价我
          </h1>
          <p className="text-gray-500 text-lg">
            生成你的专属匿名主页，让朋友放心说真话
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/60 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nickname" className="block text-sm font-semibold text-gray-800 mb-2">
                你的昵称
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你想展示的昵称"
                className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-gray-800 mb-2">
                一句话介绍 <span className="font-normal text-gray-400">（选填）</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="例如：大三计算机系，来评价我吧！"
                rows={3}
                className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                maxLength={100}
              />
            </div>

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
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-sky-600 text-white font-semibold rounded-2xl hover:from-violet-700 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  生成中...
                </span>
              ) : "生成我的匿名主页"}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              默认完全匿名
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              数据安全加密
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
