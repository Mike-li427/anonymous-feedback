"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const QRCodeSVG = dynamic(() => import("qrcode.react").then(mod => mod.QRCodeSVG), { ssr: false });

function CreatedContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");

  if (!slug || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">参数错误</p>
      </div>
    );
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/u/${slug}`;
  const manageUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/manage/${token}`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const el = document.getElementById(`copy-${type}`);
      if (el) {
        el.textContent = "已复制";
        setTimeout(() => { el.textContent = "复制链接"; }, 2000);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-violet-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-200/30 via-violet-200/20 to-transparent rounded-full blur-3xl" />
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">创建成功！</h1>
          <p className="text-gray-500">保存好你的两个入口，截图或复制链接</p>
        </div>

        <div className="space-y-4">
          {/* Public Entry */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">公开主页</h2>
                <p className="text-xs text-gray-400">分享给朋友，让他们匿名留言</p>
              </div>
            </div>
            <div className="flex justify-center py-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                {publicUrl && <QRCodeSVG value={publicUrl} size={160} />}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 truncate"
              />
              <button
                onClick={() => copyToClipboard(publicUrl, "public")}
                id="copy-public"
                className="px-4 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-all flex-shrink-0"
              >
                复制链接
              </button>
            </div>
          </div>

          {/* Private Entry */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-amber-200/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">私有管理后台</h2>
                <p className="text-xs text-gray-400">仅自己使用，用于查看留言和管理</p>
              </div>
            </div>
            <div className="flex justify-center py-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-amber-100">
                {manageUrl && <QRCodeSVG value={manageUrl} size={160} />}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={manageUrl}
                readOnly
                className="flex-1 px-3 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-sm text-gray-600 truncate"
              />
              <button
                onClick={() => copyToClipboard(manageUrl, "manage")}
                id="copy-manage"
                className="px-4 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-all flex-shrink-0"
              >
                复制链接
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-red-50/80 border border-red-200/60 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">管理链接丢失将无法找回后台</p>
            <p className="text-xs text-red-600 mt-1">请务必截图保存管理二维码或复制管理链接到安全的地方。我们不存储任何可追溯身份的信息，无法帮你恢复。</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/u/${slug}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            预览我的公开主页 →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Created() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <CreatedContent />
    </Suspense>
  );
}
