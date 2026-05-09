"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SentContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50" />
      <div className="relative w-full max-w-md text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">已匿名送达</h1>
          <p className="text-gray-500">你的留言已经成功发送</p>
        </div>
        <div className="space-y-3">
          <Link href="/" className="block w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-sky-600 text-white font-semibold rounded-2xl hover:from-violet-700 hover:to-sky-700 transition-all shadow-lg shadow-violet-500/20">
            我也生成一个主页
          </Link>
          {slug && (
            <Link href={`/u/${slug}`} className="block w-full py-3.5 px-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-all">
              返回 TA 的主页
            </Link>
          )}
        </div>
        <div className="text-xs text-gray-400">
          <p>你的隐私受到保护</p>
          <p>完全匿名留言不会被追溯身份</p>
        </div>
      </div>
    </div>
  );
}

export default function Sent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <SentContent />
    </Suspense>
  );
}
