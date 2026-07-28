import React from 'react';
import { Inbox, Search, FileText, ShoppingCart, AlertTriangle, Package, Wallet, Truck, LucideIcon } from 'lucide-react';

type EmptyStateIcon = 'inbox' | 'search' | 'document' | 'order' | 'warning' | 'stock' | 'finance' | 'truck';

const ICONS: Record<EmptyStateIcon, LucideIcon> = {
  inbox: Inbox,
  search: Search,
  document: FileText,
  order: ShoppingCart,
  warning: AlertTriangle,
  stock: Package,
  finance: Wallet,
  truck: Truck,
};

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'inbox', title, description, action }) => {
  const Icon = ICONS[icon];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-9 h-9 text-slate-400" />
      </div>
      <p className="text-slate-600 font-semibold">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
