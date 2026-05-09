"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPaymentOrder, getPaymentOrderByMessage, confirmPayment } from "@/lib/actions";

export default function Payment() {
  const params = useParams();
  const router = useRouter();
  const messageId = params.messageId as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        let existing = await getPaymentOrderByMessage(messageId);
        if (!existing) {
          existing = await createPaymentOrder(messageId, "");
        }
        setOrder(existing);
        if (existing.status === "pending") {
          setPolling(true);
        }
      } catch (err: any) {
        setError(err.message || "加载失败");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [messageId]);

  useEffect(() => {
    if (!polling || !order) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getPaymentOrderByMessage(messageId);
        if (updated) {
          setOrder(updated);
          if (updated.status === "paid") {
            setPolling(false);
            clearInterval(interval);
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, order, messageId]);

  const handleTestConfirm = async () => {
    if (!order) return;
    try {
      await confirmPayment(order.id);
      setOrder({ ...order, status: "paid" });
    } catch (err: any) {
      setError(err.message || "确认失败");
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

  if (order?.status === "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50" />
        <div className="relative w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">支付成功</h1>
            <p className="text-gray-500">身份已解锁，返回后台查看</p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-sky-600 text-white font-semibold rounded-2xl hover:from-violet-700 hover:to-sky-700 transition-all shadow-lg shadow-violet-500/20"
          >
            返回后台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-sky-50" />
      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/60 p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">解锁身份卡</h1>
            <p className="text-gray-500">支付后即可查看留言者的身份信息</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-500 mb-1">支付金额</p>
            <p className="text-4xl font-bold text-gray-900">¥5.20</p>
          </div>

          <div className="bg-sky-50 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-sky-900 mb-1">隐私提示</p>
              <p className="text-xs text-sky-700">仅能查看对方自愿授权留下的信息。留言者主动选择允许被解锁，并填写了身份卡后，你才可以看到这些信息。</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-amber-800 mb-2">支付配置待完善</p>
            <p className="text-xs text-amber-700 mb-4">当前为测试环境，请配置微信支付商户参数后即可使用真实支付</p>
            <button
              onClick={handleTestConfirm}
              className="w-full py-3 px-4 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-all"
            >
              测试：模拟支付成功
            </button>
            <p className="text-xs text-amber-600 mt-2">此按钮仅用于测试，正式上线后将移除</p>
          </div>

          <div className="text-center">
            <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              返回上一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
