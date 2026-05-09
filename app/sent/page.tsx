"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Sent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            已匿名送达
          </h1>
          <p className="text-gray-600">你的留言已经成功发送</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all text-center"
          >
            我也生成一个主页
          </Link>

          {slug && (
            <Link
              href={`/u/${slug}`}
              className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-center"
            >
              返回 TA 的主页
            </Link>
          )}
        </div>

        {/* Privacy Reminder */}
        <div className="text-xs text-gray-500 pt-4">
          <p>你的隐私受到保护</p>
          <p>完全匿名留言不会被追溯身份</p>
        </div>
      </div>
    </div>
  );
}
