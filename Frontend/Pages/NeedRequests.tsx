import NeedRequestPaymentPanel from "../components/purchasing/NeedRequestPaymentPanel";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import {
  ArrowDownUp,
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { UserRole } from "../types";
import {
  createNeedRequest,
  getNeedRequests,
  reviewNeedRequest,
  NeedStatus,
} from "../services/apiPurchasing/apiNeedRequests";
import NeedRequestDialog from "../components/purchasing/NeedRequestDialog";

const statuses = ["PENDING", "APPROVED", "REJECTED"] as const;
const statusStyle = {
  PENDING: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200/70",
    icon: Clock3,
    accent: "text-amber-600 bg-amber-50",
  },
  APPROVED: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    icon: CheckCircle2,
    accent: "text-emerald-600 bg-emerald-50",
  },
  REJECTED: {
    badge: "bg-rose-50 text-rose-700 ring-rose-200/70",
    icon: XCircle,
    accent: "text-rose-600 bg-rose-50",
  },
};
const PAGE_SIZE = 15;
const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-100";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#c6e911] px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-[#b5d510] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600 disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-lime-600 disabled:opacity-50";

export default function NeedRequests() {
  const { user } = useAuth();
  const { t, formatCurrency, language } = useI18n();
  const client = useQueryClient();
  const navigate = useNavigate();
  const hash = useRouterState({ select: (state) => state.location.hash });
  const role = user?.activeRole ?? user?.userRole;
  const admin =
    user?.userRole === UserRole.SUPER_ADMIN ||
    user?.additionalRoles?.includes(UserRole.SUPER_ADMIN);
  const allowed = !!admin || role === UserRole.COMMERCIAL;
  const [filter, setFilter] = useState<NeedStatus | "">("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "pending">(
    admin ? "pending" : "recent",
  );
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const closeDetails = () => {
    setSelectedId(null);
    if (hash)
      void navigate({
        to: "/dashboard/need-requests",
        hash: "",
        replace: true,
      });
  };
  const query = useQuery({
    queryKey: ["need-requests", user?.id, role],
    queryFn: getNeedRequests,
    enabled: allowed,
    refetchInterval: 60000,
  });
  useEffect(() => {
    if (hash) {
      setSelectedId(hash.replace(/^#/, ""));
      setRejecting(false);
    }
  }, [hash]);
  const errorText = (error: unknown) => {
    if (isAxiosError(error)) {
      const message: unknown = error.response?.data?.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
    return t("needs.error");
  };
  const create = useMutation({
    mutationFn: createNeedRequest,
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setBudget("");
      setDate("");
      setShowForm(false);
      setNotice(t("needs.submitted"));
      setPage(1);
      void client.invalidateQueries({ queryKey: ["need-requests"] });
    },
  });
  const review = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      reason?: string;
    }) => reviewNeedRequest(id, status, reason),
    onSuccess: () => {
      closeDetails();
      setRejecting(false);
      setReason("");
      setNotice(t("needs.reviewed"));
      void client.invalidateQueries({ queryKey: ["need-requests"] });
    },
  });
  const requests = query.data ?? [];
  const counts = { all: requests.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const request of requests) counts[request.status]++;
  const term = search.trim().toLocaleLowerCase();
  const filtered = requests
    .filter(
      (item) =>
        (!filter || item.status === filter) &&
        (!term ||
          [
            item.title,
            item.description,
            item.requester.userName,
            item.subsidiary.subsidiaryName,
          ].some((value) => value.toLocaleLowerCase().includes(term))),
    )
    .sort(
      (a, b) =>
        (sort === "pending"
          ? Number(b.status === "PENDING") - Number(a.status === "PENDING")
          : 0) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const selected = requests.find((item) => item.id === selectedId);
  const dateText = (value: string, time = false) =>
    new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
      dateStyle: "medium",
      ...(time ? { timeStyle: "short" as const } : {}),
    }).format(new Date(value));
  const openForm = () => {
    create.reset();
    setNotice("");
    setShowForm(true);
  };
  const openDetails = (id: string) => {
    review.reset();
    setRejecting(false);
    setReason("");
    setSelectedId(id);
  };
  const badge = (status: NeedStatus) => {
    const Icon = statusStyle[status].icon;
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle[status].badge}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {t(`needs.${status}`)}
      </span>
    );
  };
  if (!allowed) return <p className="p-6">{t("needs.forbidden")}</p>;
  return (
    <main className="mx-auto max-w-7xl space-y-6 text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-[#c6e911] shadow-sm sm:flex">
            <ClipboardList className="h-7 w-7" />
          </span>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {t("needs.workspace")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("needs.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t(admin ? "needs.adminIntro" : "needs.commercialIntro")}
            </p>
          </div>
        </div>
        {!admin && (
          <button onClick={openForm} className={primary}>
            <Plus className="h-4 w-4" />
            {t("needs.new")}
          </button>
        )}
      </header>
      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice("")} aria-label={t("needs.close")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(["", ...statuses] as const).map((status) => {
          const Icon = status ? statusStyle[status].icon : FileText;
          const active = filter === status;
          return (
            <button
              key={status || "all"}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition md:p-5 ${active ? "border-lime-400 ring-2 ring-lime-100" : "border-slate-100 hover:border-slate-300"}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status ? statusStyle[status].accent : "bg-slate-100 text-slate-600"}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {t(status ? `needs.${status}` : "needs.total")}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
                  {query.isPending ? "—" : counts[status || "all"]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <section aria-label={t("needs.list")} className="space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              aria-label={t("needs.search")}
              type="search"
              placeholder={t("needs.search")}
              className={`${input} pl-10`}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
            <select
              aria-label={t("needs.filter")}
              className="min-w-0 flex-1 bg-white py-3 text-sm text-slate-600 outline-none"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as NeedStatus | "");
                setPage(1);
              }}
            >
              <option value="">{t("needs.all")}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {t(`needs.${status}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <ArrowDownUp className="h-4 w-4 text-slate-400" />
            <select
              aria-label={t("needs.sort")}
              className="min-w-0 flex-1 bg-white py-3 text-sm text-slate-600 outline-none"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as "recent" | "pending");
                setPage(1);
              }}
            >
              <option value="recent">{t("needs.recent")}</option>
              <option value="pending">{t("needs.pendingFirst")}</option>
            </select>
          </div>
        </div>
        {query.isError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <p>{errorText(query.error)}</p>
            <button className={secondary} onClick={() => void query.refetch()}>
              {t("needs.retry")}
            </button>
          </div>
        )}
        {query.isPending ? (
          <div
            aria-label={t("needs.loading")}
            role="status"
            className="space-y-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white p-5"
              >
                <div className="mb-6 h-5 w-24 rounded-full bg-slate-100" />
                <div className="mb-3 h-5 w-4/5 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-50" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-50" />
              </div>
            ))}
          </div>
        ) : !query.isError && visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <span className="mb-4 rounded-2xl bg-slate-50 p-4 text-slate-400">
              <ClipboardList className="h-8 w-8" />
            </span>
            <h2 className="font-bold">
              {t(term || filter ? "needs.noResults" : "needs.empty")}
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {t(
                term || filter
                  ? "needs.adjustFilters"
                  : admin
                    ? "needs.emptyAdmin"
                    : "needs.emptyCommercial",
              )}
            </p>
            {term || filter ? (
              <button
                className={`${secondary} mt-5`}
                onClick={() => {
                  setSearch("");
                  setFilter("");
                  setPage(1);
                }}
              >
                {t("needs.reset")}
              </button>
            ) : (
              !admin && (
                <button className={`${primary} mt-5`} onClick={openForm}>
                  <Plus className="h-4 w-4" />
                  {t("needs.new")}
                </button>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    {t("needs.subject")}
                  </th>
                  <th scope="col" className="px-4 py-4 font-semibold">
                    {t("needs.requester")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-4 text-right font-semibold"
                  >
                    {t("needs.budgetShort")}
                  </th>
                  <th scope="col" className="px-4 py-4 font-semibold">
                    {t("needs.dateShort")}
                  </th>
                  <th scope="col" className="px-4 py-4 font-semibold">
                    {t("needs.filter")}
                  </th>
                  <th scope="col" className="px-4 py-4 font-semibold">
                    {t("needs.paymentStatus")}
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-4 text-right font-semibold"
                  >
                    {t("needs.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="max-w-xs px-5 py-4">
                      <button
                        onClick={() => openDetails(item.id)}
                        className="line-clamp-2 text-left font-semibold text-slate-800 hover:text-lime-700"
                      >
                        {item.title}
                      </button>
                      <p className="mt-1 text-xs text-slate-400">
                        {dateText(item.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">
                        {item.requester.userName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.subsidiary.subsidiaryName}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-slate-700">
                      {item.estimatedBudget !== null
                        ? formatCurrency(Number(item.estimatedBudget))
                        : t("needs.unspecified")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                      {item.desiredDate ? dateText(item.desiredDate) : "—"}
                    </td>
                    <td className="px-4 py-4">{badge(item.status)}</td>
                    <td className="px-4 py-4">
                      {item.payment ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("needs.paid")}
                          </span>
                          <p className="mt-1 whitespace-nowrap text-xs font-semibold text-slate-600">
                            {new Intl.NumberFormat(
                              language === "fr" ? "fr-FR" : "en-US",
                              {
                                style: "currency",
                                currency: item.payment.currency,
                              },
                            ).format(Number(item.payment.amount))}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {item.status === "APPROVED" ? t("needs.unpaid") : "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetails(item.id)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-lime-300 hover:bg-lime-50"
                      >
                        {t(
                          admin && item.status === "APPROVED" && !item.payment
                            ? "needs.pay"
                            : admin && item.status === "PENDING"
                              ? "needs.examine"
                              : "needs.details",
                        )}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!query.isPending && filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <p>{t("needs.results", { count: filtered.length })}</p>
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-30"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label={t("needs.previous")}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-30"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label={t("needs.next")}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
      {showForm && (
        <NeedRequestDialog
          title={t("needs.new")}
          subtitle={t("needs.formIntro")}
          busy={create.isPending}
          onClose={() => setShowForm(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setNotice("");
              create.mutate({
                title: title.trim(),
                description: description.trim(),
                estimatedBudget: budget === "" ? undefined : Number(budget),
                desiredDate: date || undefined,
              });
            }}
          >
            <div className="space-y-5 px-6 py-6 sm:px-8">
              <div className="flex items-start gap-3 rounded-xl border border-lime-100 bg-lime-50/70 p-3 text-sm text-lime-900">
                <BellRing className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t("needs.notificationHint")}</p>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                {t("needs.subject")} <span className="text-rose-500">*</span>
                <input
                  autoFocus
                  className={`${input} mt-2`}
                  required
                  minLength={3}
                  maxLength={200}
                  value={title}
                  placeholder={t("needs.subjectPlaceholder")}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {t("needs.description")}{" "}
                <span className="text-rose-500">*</span>
                <textarea
                  className={`${input} mt-2 resize-y`}
                  rows={5}
                  required
                  minLength={10}
                  maxLength={10000}
                  value={description}
                  placeholder={t("needs.descriptionPlaceholder")}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <span className="mt-1 block text-right text-[11px] font-normal text-slate-400">
                  {description.length.toLocaleString()} / 10 000
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  {t("needs.budget")}
                  <input
                    className={`${input} mt-2`}
                    type="number"
                    min="0"
                    max="9999999999999.99"
                    step="0.01"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  {t("needs.date")}
                  <input
                    className={`${input} mt-2`}
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </label>
              </div>
              {create.error && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {errorText(create.error)}
                </p>
              )}
            </div>
            <footer className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
              <button
                type="button"
                className={secondary}
                disabled={create.isPending}
                onClick={() => setShowForm(false)}
              >
                {t("needs.cancel")}
              </button>
              <button
                className={primary}
                disabled={
                  create.isPending ||
                  title.trim().length < 3 ||
                  description.trim().length < 10
                }
              >
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {t(create.isPending ? "needs.saving" : "needs.submit")}
              </button>
            </footer>
          </form>
        </NeedRequestDialog>
      )}
      {selected && (
        <NeedRequestDialog
          title={selected.title}
          subtitle={t("needs.requestDetails")}
          busy={review.isPending || paymentBusy}
          onClose={closeDetails}
        >
          <div className="space-y-6 px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {badge(selected.status)}
              <span className="text-xs text-slate-400">
                {dateText(selected.createdAt, true)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold">{selected.requester.userName}</p>
              <p className="mt-1 text-xs text-slate-500">
                {selected.subsidiary.subsidiaryName}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("needs.description")}
              </h3>
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                {selected.description}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
              <div>
                <dt className="text-xs text-slate-400">
                  {t("needs.budgetShort")}
                </dt>
                <dd className="mt-1 break-words text-base font-bold sm:text-lg">
                  {selected.estimatedBudget !== null
                    ? formatCurrency(Number(selected.estimatedBudget))
                    : t("needs.unspecified")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">
                  {t("needs.dateShort")}
                </dt>
                <dd className="mt-1 break-words text-base font-bold sm:text-lg">
                  {selected.desiredDate
                    ? dateText(selected.desiredDate)
                    : t("needs.unspecified")}
                </dd>
              </div>
            </dl>
            {selected.reviewer && (
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {t("needs.reviewBy")}{" "}
                  <span className="font-semibold text-slate-700">
                    {selected.reviewer.userName}
                  </span>
                  {selected.reviewedAt && (
                    <span className="mt-1 block text-xs">
                      {dateText(selected.reviewedAt, true)}
                    </span>
                  )}
                </p>
              </div>
            )}
            {selected.rejectionReason && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
                <h3 className="mb-1 text-xs font-bold">{t("needs.reason")}</h3>
                <p className="whitespace-pre-wrap break-words text-sm">
                  {selected.rejectionReason}
                </p>
              </div>
            )}
            {selected.payment && (
              <section className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <h3 className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  {t("needs.paid")}
                </h3>
                <p className="text-2xl font-bold text-emerald-900">
                  {new Intl.NumberFormat(
                    language === "fr" ? "fr-FR" : "en-US",
                    { style: "currency", currency: selected.payment.currency },
                  ).format(Number(selected.payment.amount))}
                </p>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">
                      {t("needs.paymentSource")}
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {
                        selected.payment.financialTransaction.treasuryAccount
                          .accountName
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      {t("needs.beneficiary")}
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {selected.payment.beneficiary}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      {t("needs.payDate")}
                    </dt>
                    <dd className="mt-1">
                      {dateText(selected.payment.paidAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      {t("needs.paidBy")}
                    </dt>
                    <dd className="mt-1">{selected.payment.paidBy.userName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      {t("needs.payReference")}
                    </dt>
                    <dd className="mt-1 break-all">
                      {selected.payment.reference || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      {t("needs.payCategory")}
                    </dt>
                    <dd className="mt-1">
                      {t(`needs.categories.${selected.payment.category}`)}
                    </dd>
                  </div>
                </dl>
              </section>
            )}
            {admin && selected.status === "APPROVED" && !selected.payment && (
              <NeedRequestPaymentPanel
                key={selected.id}
                request={selected}
                onBusyChange={setPaymentBusy}
                onPaid={() => setNotice(t("needs.paymentSuccess"))}
              />
            )}
            {review.error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
              >
                {errorText(review.error)}
              </p>
            )}
            {admin && selected.status === "PENDING" && rejecting && (
              <form
                id="reject-need-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setNotice("");
                  review.mutate({
                    id: selected.id,
                    status: "REJECTED",
                    reason: reason.trim(),
                  });
                }}
              >
                <label className="block text-sm font-semibold text-slate-700">
                  {t("needs.reason")} <span className="text-rose-500">*</span>
                  <textarea
                    autoFocus
                    className={`${input} mt-2`}
                    rows={3}
                    required
                    maxLength={2000}
                    value={reason}
                    placeholder={t("needs.reasonPlaceholder")}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
              </form>
            )}
          </div>
          <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            {admin && selected.status === "PENDING" ? (
              rejecting ? (
                <>
                  <button
                    className={secondary}
                    disabled={review.isPending}
                    onClick={() => {
                      setRejecting(false);
                      review.reset();
                    }}
                  >
                    {t("needs.cancel")}
                  </button>
                  <button
                    form="reject-need-form"
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                    disabled={review.isPending || !reason.trim()}
                  >
                    {review.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {t("needs.confirmReject")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={secondary}
                    disabled={review.isPending}
                    onClick={() => {
                      setRejecting(true);
                      setReason("");
                      review.reset();
                    }}
                  >
                    <X className="h-4 w-4" />
                    {t("needs.reject")}
                  </button>
                  <button
                    className={primary}
                    disabled={review.isPending}
                    onClick={() => {
                      setNotice("");
                      review.mutate({ id: selected.id, status: "APPROVED" });
                    }}
                  >
                    {review.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {t("needs.approve")}
                  </button>
                </>
              )
            ) : (
              <button
                className={secondary}
                disabled={paymentBusy}
                onClick={closeDetails}
              >
                {t("needs.close")}
              </button>
            )}
          </footer>
        </NeedRequestDialog>
      )}
    </main>
  );
}
