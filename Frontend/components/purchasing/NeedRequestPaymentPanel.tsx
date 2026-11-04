import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Wallet, AlertCircle } from "lucide-react";
import { useI18n } from "../../i18n";
import {
  getNeedPaymentAccount,
  payNeedRequest,
  NeedExpenseCategory,
  NeedRequest,
} from "../../services/apiPurchasing/apiNeedRequests";

const categories: NeedExpenseCategory[] = [
  "PURCHASE_COST",
  "ADVERTISING",
  "TRANSPORT",
  "SERVICES",
  "PACKAGING",
  "RENT",
  "SALARIES",
  "INSURANCE",
  "COMMISSIONS",
  "TRANSACTION_FEES",
  "OTHER",
];
const input =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100 disabled:opacity-50";

export default function NeedRequestPaymentPanel({
  request,
  onBusyChange,
  onPaid,
}: {
  request: NeedRequest;
  onBusyChange: (busy: boolean) => void;
  onPaid: () => void;
}) {
  const { t, language } = useI18n();
  const client = useQueryClient();
  const [amount, setAmount] = useState(
    Number(request.estimatedBudget) > 0 ? String(request.estimatedBudget) : "",
  );
  const [beneficiary, setBeneficiary] = useState("");
  const [category, setCategory] = useState<NeedExpenseCategory>("OTHER");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  });
  const account = useQuery({
    queryKey: ["need-payment-account", request.id],
    queryFn: () => getNeedPaymentAccount(request.id),
    staleTime: 0,
  });
  const errorText = (error: unknown) => {
    if (isAxiosError(error)) {
      const message: unknown = error.response?.data?.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
    return t("needs.error");
  };
  const pay = useMutation({
    mutationFn: () =>
      payNeedRequest(request.id, {
        amount: Number(amount),
        beneficiary: beneficiary.trim(),
        category,
        transactionDate: date,
        reference: reference.trim() || undefined,
      }),
    onSuccess: (updated) => {
      client.setQueriesData<NeedRequest[]>(
        { queryKey: ["need-requests"] },
        (old) => old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      for (const key of [
        "need-requests",
        "need-payment-account",
        "treasuryAccounts",
        "financialTransactions",
        "notifications",
        "analytics",
      ])
        void client.invalidateQueries({ queryKey: [key] });
      onPaid();
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ["need-requests"] });
      void account.refetch();
    },
  });
  useEffect(() => {
    onBusyChange(pay.isPending);
    return () => onBusyChange(false);
  }, [pay.isPending, onBusyChange]);
  const insufficient =
    !!account.data && Number(amount) > Number(account.data.balance);
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency,
    }).format(value);
  return (
    <section className="rounded-2xl border border-lime-200 bg-lime-50/30 p-4">
      <h3 className="flex items-center gap-2 font-bold text-slate-800">
        <Wallet className="h-5 w-5 text-lime-700" />
        {t("needs.payTitle")}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {t("needs.payHint")}
      </p>
      {account.isPending && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 text-sm text-slate-500"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("needs.loading")}
        </p>
      )}
      {account.error && (
        <div role="alert" className="mt-3 text-sm text-rose-700">
          <p>{errorText(account.error)}</p>
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => void account.refetch()}
          >
            {t("needs.retry")}
          </button>
        </div>
      )}
      {account.data && (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            pay.mutate();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-lime-100 bg-white px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">
                {t("needs.paymentSource")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {account.data.accountName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">
                {t("needs.availableBalance")}
              </p>
              <p className="mt-1 font-bold text-slate-800">
                {money(Number(account.data.balance), account.data.currency)}
              </p>
            </div>
          </div>
          <fieldset disabled={pay.isPending} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                {t("needs.payAmount")} ({account.data.currency})
                <input
                  className={input}
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max="9999999999999.99"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
               <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
              <label className="block text-xs font-semibold text-slate-600">
                {t("needs.payDate")}
                <input
                  className={input}
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
               <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">
              {t("needs.beneficiary")}
              <input
                className={input}
                required
                minLength={2}
                maxLength={255}
                value={beneficiary}
                onChange={(event) => setBeneficiary(event.target.value)}
              />
             <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                {t("needs.payCategory")}
                <select
                  className={input}
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as NeedExpenseCategory)
                  }
                >
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {t(`needs.categories.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                {t("needs.payReference")}
                <input
                  className={input}
                  maxLength={100}
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </label>
            </div>
          </fieldset>
          {insufficient && (
            <p
              role="alert"
              className="flex items-center gap-2 text-xs text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t("needs.insufficientBalance")}
            </p>
          )}
          {pay.error && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {errorText(pay.error)}
            </p>
          )}
          <p className="text-xs text-slate-500">{t("needs.payConfirmHint")}</p>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c6e911] px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-[#b5d510] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              pay.isPending ||
              account.isError ||
              insufficient ||
              Number(amount) <= 0 ||
              !amount ||
              beneficiary.trim().length < 2 ||
              !date
            }
          >
            {pay.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            {t(pay.isPending ? "needs.paying" : "needs.confirmPayment")}
          </button>
        </form>
      )}
    </section>
  );
}
