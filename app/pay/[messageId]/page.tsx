"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockRevealMessage } from "@/lib/actions";

export default function Payment() {
  const params = useParams();
  const router = useRouter();
  const messageId = params.messageId as string;

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  const handleMockPay = async () => {
    setIsPaying(true);
    setError("");

    try {
      await mockRevealMessage(messageId);
      router.push("/dashboard");
    } catch (err) {
      setError("操作失败，请重试");
      setIsPaying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Payment Card */}
        <div className="bg-white rounded-xl shadow-lg border p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-orange-600"
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
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              解锁身份卡
            </h1>
            <p className="text-gray-600">支付后即可查看留言者的身份信息</p>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">支付金额</p>
            <p className="text-3xl font-bold text-orange-600">¥5.20</p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  隐私提示
                </p>
                <p className="text-xs text-blue-700">
                  仅能查看对方自愿授权留下的信息。留言者主动选择允许被解锁，并填写了身份卡后，你才可以看到这些信息。
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Mock Payment Button */}
          <button
            onClick={handleMockPay}
            disabled={isPaying}
            className="w-full py-3 px-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPaying ? "处理中..." : "模拟支付成功"}
          </button>

          <p className="text-xs text-center text-gray-400">
            第一版测试：点击即模拟支付成功
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
