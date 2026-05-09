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
      const profile = await createProfile(nickname.trim(), bio.trim());
      // Store profile ID in localStorage for dashboard access
      localStorage.setItem("profileId", profile.id);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "创建失败，请重试");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            来匿名评价我
          </h1>
          <p className="text-gray-600">
            生成你的匿名主页，让朋友们匿名给你留言
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              你的昵称
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入你想展示的昵称"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              maxLength={20}
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              一句话介绍（选填）
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="例如：大三计算机系，来评价我吧！"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              maxLength={100}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "生成中..." : "生成我的匿名主页"}
          </button>
        </form>

        {/* Privacy Notice */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>完全匿名留言不会留下可查看身份</p>
          <p>只有访客主动选择可解锁身份卡，主页主人才可查看</p>
        </div>
      </div>
    </div>
  );
}
