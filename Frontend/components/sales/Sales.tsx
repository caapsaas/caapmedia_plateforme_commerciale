import React, { useState, useMemo, useRef } from "react";
import {
  Order,
  OrderItem,
  PaymentStatus,
  OrderStatus,
  Product,
  Contact,
  CustomerPaymentMethod,
  TopSellingProduct,
} from "../../types";
import { useI18n } from "../../i18n";
import { useToast } from "../../context/ToastContext";
import SelectFilter from "../filters/SelectFilter";
import PeriodFilter from "../filters/PeriodFilter";
import IconDocumentText from "../icons/IconDocumentText";
import BonDeLivraison from "../../Pages/BonDeLivraison";
import BonDeCommande from "../../Pages/BonDeCommande";
import IconInvoice from "../icons/IconInvoice";
import InvoiceModal from "../../Pages/InvoiceModal";
import RecordPaymentModal from "./RecordPaymentModal";
import OrderStatusUpdateModal from "./OrderStatusUpdateModal";
import IconCoins from "../icons/IconCoins";
import IconEdit from "../icons/IconEdit";
import IconChevronDown from "../icons/IconChevronDown";
import IconCheckCircle from "../icons/IconCheckCircle";
import IconExclamationTriangle from "../icons/IconExclamationTriangle";
import NewOrder from "../../Pages/NewOrder";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  recordOrderPayment,
  updateOrderStatus,
  createOrderBySalesRepJson,
  FindAllOrdersDto,
  getTopSellingProducts,
} from "../../services/apiE-commerce/apiOrders";
import { getProductsBySubsidiary } from "../../services/apiE-commerce/apiProducts";
import { getContacts } from "../../services/apiCrm/apicontacts";
import { useAuth } from "../../context/AuthContext";

const initialFilterState: FindAllOrdersDto = { period: "all_time" };
const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

const getPeriodDates = (period: FindAllOrdersDto["period"]) => {
  const now = new Date();

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  switch (period) {
    case "last_7_days": {
      const start = new Date();
      start.setDate(now.getDate() - 7);

      return {
        startDate: formatDate(start),
        endDate: formatDate(now),
      };
    }

    case "last_30_days": {
      const start = new Date();
      start.setDate(now.getDate() - 30);

      return {
        startDate: formatDate(start),
        endDate: formatDate(now),
      };
    }

    case "last_90_days": {
      const start = new Date();
      start.setDate(now.getDate() - 90);

      return {
        startDate: formatDate(start),
        endDate: formatDate(now),
      };
    }

    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        startDate: formatDate(start),
        endDate: formatDate(now),
      };
    }

    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const end = new Date(now.getFullYear(), now.getMonth(), 0);

      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
      };
    }

    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);

      return {
        startDate: formatDate(start),
        endDate: formatDate(now),
      };
    }

    case "custom":
    default:
      return {
        startDate: "",
        endDate: "",
      };
  }
};

const Sales: React.FC = () => {
  const { user, subsidiary } = useAuth();
  const { t, formatCurrency } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"history" | "new">("history");

  // --- TanStack Query Data Fetching ---
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts", subsidiary?.id],
    queryFn: getContacts,
    enabled: !!subsidiary,
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<
    Product[]
  >({
    queryKey: ["products", subsidiary?.id],
    queryFn: () => getProductsBySubsidiary(),
    enabled: !!subsidiary,
  });

  // State for filters
  const [filters, setFilters] = useState<FindAllOrdersDto>(initialFilterState);
  const [appliedFilters, setAppliedFilters] =
    useState<FindAllOrdersDto>(initialFilterState);

  const { data: filteredOrders = [], isLoading: isLoadingOrders } = useQuery<
    Order[]
  >({
    queryKey: ["orders", subsidiary?.id, appliedFilters],
    queryFn: () => getOrders(appliedFilters),
    enabled: !!subsidiary,
  });

  const {
    data: topSellingProducts = [],
    isLoading: isLoadingTopSellingProducts,
  } = useQuery<TopSellingProduct[]>({
    queryKey: ["top-selling-products", subsidiary?.id],
    queryFn: () => getTopSellingProducts(),
    enabled: !!subsidiary,
  });

  if (!subsidiary || !user) {
    // This should ideally be handled by a protected route, but this is a safeguard.
    return <div>Chargement ou erreur d'authentification...</div>;
  }

  // --- TanStack Query Mutations ---
  const { mutate: recordPaymentMutate } = useMutation({
    mutationFn: (payload: {
      orderId: string;
      amount: number;
      paymentMethod: CustomerPaymentMethod;
    }) => recordOrderPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(
        "Paiement enregistré!",
        "Le paiement a été enregistré avec succès.",
      );
    },
    onError: () => {
      toast.error(
        "Erreur de paiement",
        "Une erreur est survenue lors de l'enregistrement du paiement.",
      );
    },
  });

  const { mutate: updateOrderStatusMutate } = useMutation({
    mutationFn: (payload: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(
        "Statut mis à jour!",
        "Le statut de la commande a été mis à jour avec succès.",
      );
    },
    onError: () => {
      toast.error(
        "Erreur de mise à jour",
        "Une erreur est survenue lors de la mise à jour du statut.",
      );
    },
  });

  const { mutate: createOrderMutate } = useMutation({
    mutationFn: createOrderBySalesRepJson,
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Commande créée!", "La commande a été créée avec succès.");

      // Fusionner la réponse de l'API avec les données envoyées (via ref pour éviter race condition)
      const cachedData = lastOrderDataRef.current;
      const enrichedOrder: Order = {
        ...newOrder,
        date: newOrder.date || cachedData?.date || new Date().toISOString(),
        totalAmount: newOrder.totalAmount ?? cachedData?.totalAmount ?? 0,
        paymentDueDate: newOrder.paymentDueDate || cachedData?.paymentDueDate || '',
        subtotal: newOrder.subtotal ?? cachedData?.subtotal ?? 0,
        taxAmount: newOrder.taxAmount ?? cachedData?.taxAmount ?? 0,
      };

      setBonDeCommandeOrder(enrichedOrder);
      setActiveTab("history");
      lastOrderDataRef.current = null;
    },
    onError: () => {
      toast.error(
        "Erreur de création",
        "Une erreur est survenue lors de la création de la commande.",
      );
      lastOrderDataRef.current = null;
    },
  });

  const handlePlaceOrder = (
    newOrderData: Omit<Order, "id" | "subsidiaryId">,
  ) => {
    const itemsForJson = newOrderData.items.map((item: OrderItem) => {
      // Convertir les options en tableau d'objets {optionType, optionValue}
      const optionsArray = item.options
        ? Object.entries(item.options).map(([optionType, optionValue]: [string, string]) => ({
            optionType,
            optionValue: String(optionValue),
          }))
        : [];

      return {
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.price, // ← Prix unitaire depuis item.price
        options: optionsArray,
      };
    });

    // Créer l'objet de commande pour l'endpoint JSON
    const orderData: {
      customerId: string;
      customerName: string;
      paymentDueDate: string;
      paymentMethod: CustomerPaymentMethod;
      source: 'MANUAL' | 'WEB_ORDER' | 'QUOTE_REQUEST';
      items: Array<{ productId: string; quantity: number; unitPrice: number; options: Array<{ optionType: string; optionValue: string }> }>;
      date?: string;
      subtotal?: number;
      taxAmount?: number;
      totalAmount?: number;
      customTaxRate?: number;
    } = {
      customerId: newOrderData.customerId,
      customerName: newOrderData.customerName,
      paymentDueDate: newOrderData.paymentDueDate,
      paymentMethod: newOrderData.paymentMethod,
      source: "MANUAL",
      items: itemsForJson,
      date: newOrderData.date,
      subtotal: newOrderData.subtotal,
      taxAmount: newOrderData.taxAmount,
      totalAmount: newOrderData.totalAmount,
    };

    // Inclure customTaxRate si présent
    if ('customTaxRate' in newOrderData && newOrderData.customTaxRate !== undefined) {
      orderData.customTaxRate = (newOrderData as { customTaxRate?: number }).customTaxRate;
    }

    // Logs pour débogage
    console.log("Order data being sent:", orderData);

    // Capturer les données pour enrichir la réponse de l'API (via ref pour éviter race condition)
    lastOrderDataRef.current = orderData;
    createOrderMutate(orderData);
  };

  // State for modals
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [updatingStatusOrder, setUpdatingStatusOrder] = useState<Order | null>(
    null,
  );
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [blOrder, setBlOrder] = useState<Order | null>(null);
  const [bonDeCommandeOrder, setBonDeCommandeOrder] = useState<Order | null>(null);

  // Ref pour capturer les données de commande sans race condition
  const lastOrderDataRef = useRef<{
    customerId: string;
    customerName: string;
    paymentDueDate: string;
    paymentMethod: CustomerPaymentMethod;
    source: 'MANUAL' | 'WEB_ORDER' | 'QUOTE_REQUEST';
    items: Array<{ productId: string; quantity: number; unitPrice: number; options: Array<{ optionType: string; optionValue: string }> }>;
    customTaxRate?: number;
    date?: string;
    totalAmount?: number;
    subtotal?: number;
    taxAmount?: number;
  } | null>(null);

  // State for UI toggles
  const [showOrderHistory, setShowOrderHistory] = useState(true);
  const [showTopProducts, setShowTopProducts] = useState(true);

  const handleApplyFilters = () => {
    // Nettoyer les filtres: supprimer les valeurs vides
    const cleanedFilters: FindAllOrdersDto = {};

    if (filters.customerId) cleanedFilters.customerId = filters.customerId;
    if (filters.productId) cleanedFilters.productId = filters.productId;
    if (filters.orderStatus) cleanedFilters.orderStatus = filters.orderStatus;
    if (filters.paymentStatus) cleanedFilters.paymentStatus = filters.paymentStatus;
    if (filters.period) cleanedFilters.period = filters.period;
    if (filters.startDate) cleanedFilters.startDate = filters.startDate;
    if (filters.endDate) cleanedFilters.endDate = filters.endDate;

    setAppliedFilters(cleanedFilters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
  };

  const clientOptions = useMemo(
    () =>
      contacts.map((c) => ({
        value: c.id,
        label: `${c.contactName} (${c.company || "N/A"})`,
      })),
    [contacts],
  );
  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.productName })),
    [products],
  );
  const orderStatusOptions = useMemo(
    () =>
      Object.values(OrderStatus).map((s) => ({
        value: s,
        label: t(`order.status_${s}`),
      })),
    [t],
  );
  const paymentStatusOptions = useMemo(
    () =>
      Object.values(PaymentStatus).map((s) => ({
        value: s,
        label: t(`order.paymentStatus_${s}`),
      })),
    [t],
  );

  const getPaymentStatusClass = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return "bg-green-100 text-green-800";
      case PaymentStatus.PARTIALLY_PAID:
        return "bg-yellow-100 text-yellow-800";
      case PaymentStatus.UNPAID:
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getOrderStatusClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
      case OrderStatus.DELIVERED:
        return "bg-green-100 text-green-800";
      case OrderStatus.IN_PRODUCTION:
      case OrderStatus.PENDING_DELIVERY:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.PENDING_VALIDATION:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const TabButton: React.FC<{ view: "history" | "new"; label: string }> = ({
    view,
    label,
  }) => (
    <button
      onClick={() => setActiveTab(view)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] ${
        activeTab === view
          ? "bg-[#c6e911] text-slate-800 shadow"
          : "bg-white text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800">
          {t("sidebar.orders")}
        </h2>
        <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
          <TabButton view="history" label={t("myOrders.historyTab")} />
          <TabButton view="new" label={t("myOrders.newOrderTab")} />
        </div>
      </div>

      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Order History Section */}
          <div className="bg-white rounded-xl shadow-md p-6 pt-0 space-y-4">
            <button
              onClick={() => setShowOrderHistory(!showOrderHistory)}
              className="w-full p-4 text-left flex justify-between items-center"
            >
              <h3 className="text-xl font-semibold text-slate-800">
                {t("sales.orderHistoryTitle")}
              </h3>
              <IconChevronDown
                className={`h-6 w-6 transition-transform ${showOrderHistory ? "rotate-180" : ""}`}
              />
            </button>
            {showOrderHistory && (
              <div className="p-6 pt-0">
                <div className="p-4 bg-slate-50 rounded-lg -mx-6 px-6 -mt-0 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SelectFilter
                      name="customerId"
                      label={t("filter.client")}
                      value={filters.customerId || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customerId: e.target.value,
                        }))
                      }
                      options={clientOptions}
                      placeholder={t("filter.allClients")}
                    />
                    <SelectFilter
                      name="productId"
                      label={t("filter.product")}
                      value={filters.productId || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          productId: e.target.value,
                        }))
                      }
                      options={productOptions}
                      placeholder={t("filter.allProducts")}
                    />
                    <SelectFilter
                      name="orderStatus"
                      label={t("filter.orderStatus")}
                      value={filters.orderStatus || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          orderStatus: e.target.value as OrderStatus,
                        }))
                      }
                      options={orderStatusOptions}
                      placeholder={t("filter.allOrderStatuses")}
                    />
                    <SelectFilter
                      name="paymentStatus"
                      label={t("filter.paymentStatus")}
                      value={filters.paymentStatus || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          paymentStatus: e.target.value as PaymentStatus,
                        }))
                      }
                      options={paymentStatusOptions}
                      placeholder={t("filter.allPaymentStatuses")}
                    />
                    <div className="md:col-span-2 lg:col-span-4">
                      <PeriodFilter
                        period={filters.period || "all_time"}
                        onPeriodChange={(e) => {
                          const period = e.target
                            .value as FindAllOrdersDto["period"];

                          const dates = getPeriodDates(period);
                          if (period === "all_time") {
                            setFilters((prev) => {
                              const { startDate, endDate, ...rest } = prev;

                              return {
                                ...rest,
                                period,
                              };
                            });
                          } else {
                            setFilters((prev) => ({
                              ...prev,
                              period,
                              startDate: dates.startDate,
                              endDate: dates.endDate,
                            }));
                          }
                        }}
                        startDate={filters.startDate || ""}
                        onStartDateChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                            period: "custom",
                          }))
                        }
                        endDate={filters.endDate || ""}
                        onEndDateChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                            period: "custom",
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 flex justify-end items-center gap-2 mt-2">
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors h-10"
                      >
                        {t("filter.reset")}
                      </button>
                      <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors h-10"
                      >
                        {t("filter.apply")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
  {isLoadingOrders || isLoadingProducts ? (
    <table className="w-full text-sm text-left text-slate-500">
      <thead className="text-xs text-slate-700 uppercase bg-slate-50">
        <tr>
          <th className="px-6 py-3">{t("order.orderId")}</th>
          <th className="px-6 py-3">{t("order.customer")}</th>
          <th className="px-6 py-3">{t("order.date")}</th>
          <th className="px-6 py-3 text-right">{t("order.total")}</th>
          <th className="px-6 py-3 text-center">{t("order.paymentStatus")}</th>
          <th className="px-6 py-3 text-center">{t("order.orderStatus")}</th>
          <th className="px-6 py-3 text-center">{t("common.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 4 }).map((_, i) => (
          <tr key={i} className="bg-white border-b" style={{ opacity: 1 - i * 0.1 }}>
            <td className="px-6 py-4">
              <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
            </td>
            <td className="px-6 py-4">
              <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
            </td>
            <td className="px-6 py-4">
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-2 w-20 bg-slate-100 rounded animate-pulse mt-1" />
            </td>
            <td className="px-6 py-4">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse ml-auto" />
            </td>
            <td className="px-6 py-4 text-center">
              <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse mx-auto" />
            </td>
            <td className="px-6 py-4 text-center">
              <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse mx-auto" />
            </td>
            <td className="px-6 py-4 text-center">
              <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mx-auto" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <>
      <table className="w-full text-sm text-left text-slate-500">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
          <tr>
            <th className="px-6 py-3">{t("order.orderId")}</th>
            <th className="px-6 py-3">{t("order.customer")}</th>
            <th className="px-6 py-3">{t("order.date")}</th>
            <th className="px-6 py-3 text-right">{t("order.total")}</th>
            <th className="px-6 py-3 text-center">{t("order.paymentStatus")}</th>
            <th className="px-6 py-3 text-center">{t("order.orderStatus")}</th>
            <th className="px-6 py-3 text-center">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPaymentLate =
              order.paymentStatus !== PaymentStatus.PAID &&
              new Date(order.paymentDueDate) < today;
            const hasStatusIssue = order.status === OrderStatus.CANCELLED;
            const isPendingValidation =
              order.status === OrderStatus.PENDING_VALIDATION;

            return (
              <tr
                key={order.id}
                className={`bg-white border-b hover:bg-slate-50 transition-colors ${isPendingValidation ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
              >
                <td className="px-6 py-4 font-semibold text-slate-800">{order.id.substring(0, 8)}</td>
                <td className="px-6 py-4 text-slate-800">{order.customerName}</td>
                <td className="px-6 py-4 text-slate-700">
                  <div>
                    {(() => {
                      const parsedDate = parseDate(order.date);
                      return parsedDate ? parsedDate.toLocaleDateString("fr-FR") : "N/A";
                    })()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(() => {
                      const parsedDate = parseDate(order.date);
                      return parsedDate ? parsedDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="font-bold text-slate-800">
                    {(() => {
                      const total = order.totalAmount || order.subtotal || 0;
                      return formatCurrency(total);
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusClass(order.paymentStatus)}`}>
                      {t(`order.paymentStatus_${order.paymentStatus}`)}
                    </span>
                    {isPaymentLate && (
                      <span title={t("sales.paymentOverdue")}>
                        <IconExclamationTriangle className="h-5 w-5 text-red-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getOrderStatusClass(order.status)}`}>
                      {t(`order.status_${order.status}`)}
                    </span>
                    {hasStatusIssue && (
                      <span title={t("sales.statusIssue")}>
                        <IconExclamationTriangle className="h-5 w-5 text-orange-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {order.status === OrderStatus.PENDING_VALIDATION ? (
                    <button
                      onClick={() => updateOrderStatusMutate({ orderId: order.id, status: OrderStatus.IN_PRODUCTION })}
                      className="flex items-center mx-auto space-x-2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition-colors"
                      title={t("sales.validateForProduction")}
                    >
                      <IconCheckCircle className="h-4 w-4" />
                      <span>{t("sales.validateForProduction")}</span>
                    </button>
                  ) : (
                    <div className="flex justify-center items-center space-x-2">
                      {order.paymentStatus !== PaymentStatus.PAID && order.status !== OrderStatus.CANCELLED && (
                        <button
                          onClick={() => setPayingOrder(order)}
                          className="p-2 text-green-700 hover:bg-green-100 rounded-md transition-colors"
                          title={t("order.recordPayment")}
                        >
                          <IconCoins className="h-5 w-5" />
                        </button>
                      )}
                      {order.status !== OrderStatus.CANCELLED && (
                        <button
                          onClick={() => setUpdatingStatusOrder(order)}
                          className="p-2 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                          title={t("order.updateStatus")}
                        >
                          <IconEdit className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setBonDeCommandeOrder(order)}
                        className="p-2 text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                        title={t("common.viewBonDeCommande")}
                      >
                        <IconDocumentText className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setBlOrder(order)}
                        className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                        title={t("common.viewBL")}
                      >
                        <IconDocumentText className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filteredOrders.length === 0 && (
        <p className="text-center py-8 text-slate-500">{t("filter.noResults")}</p>
      )}
    </>
  )}
</div>
              </div>
            )}
          </div>

          {/* Top Selling Products Section */}
          <div className="bg-white rounded-xl shadow-md">
            <button
              onClick={() => setShowTopProducts(!showTopProducts)}
              className="w-full p-4 text-left flex justify-between items-center"
            >
              <h3 className="text-xl font-semibold text-slate-800">
                {t("sales.topSellingProducts.title")}
              </h3>
              <IconChevronDown
                className={`h-6 w-6 transition-transform ${showTopProducts ? "rotate-180" : ""}`}
              />
            </button>
            {showTopProducts && (
              <div className="p-6 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                      <tr>
                        <th className="px-6 py-3">
                          {t("sales.topSellingProducts.product")}
                        </th>
                        <th className="px-6 py-3 text-center">
                          {t("sales.topSellingProducts.quantity")}
                        </th>
                        <th className="px-6 py-3 text-right">
                          {t("sales.topSellingProducts.revenue")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellingProducts.map((p) => (
                        <tr
                          key={p.productName}
                          className="bg-white border-b hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-semibold">
                            {p.productName}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {p.quantity}
                          </td>
                          <td className="px-6 py-4 text-right font-bold">
                            {formatCurrency(p.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "new" && (
        <NewOrder
          subsidiary={subsidiary}
          products={products}
          onOrderPlaced={handlePlaceOrder}
        />
      )}

      {/* Modals */}
      {payingOrder && (
        <RecordPaymentModal
          isOpen={!!payingOrder}
          onClose={() => setPayingOrder(null)}
          order={payingOrder}
          onRecordPayment={(orderId, amount, paymentMethod) =>
            recordPaymentMutate({ orderId, amount, paymentMethod })
          }
        />
      )}
      {updatingStatusOrder && (
        <OrderStatusUpdateModal
          isOpen={!!updatingStatusOrder}
          onClose={() => setUpdatingStatusOrder(null)}
          order={updatingStatusOrder}
          onUpdateStatus={(orderId, newStatus) =>
            updateOrderStatusMutate({ orderId, status: newStatus })
          }
        />
      )}
      {invoiceOrder && (
        <InvoiceModal
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          order={invoiceOrder}
          subsidiary={subsidiary}
          client={contacts.find(c => c.id === invoiceOrder.customerId) ?? null}
        />
      )}
      {blOrder && (
        <BonDeLivraison
          order={blOrder}
          subsidiary={subsidiary}
          onClose={() => setBlOrder(null)}
        />
      )}
      {bonDeCommandeOrder && (
        <BonDeCommande
          order={bonDeCommandeOrder}
          subsidiary={subsidiary}
          onClose={() => setBonDeCommandeOrder(null)}
        />
      )}
    </div>
  );
};

export default Sales;
