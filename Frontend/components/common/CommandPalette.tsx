import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  ArrowRight,
  FileText,
  ShoppingBag,
  Users,
  Briefcase,
  Truck,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { globalSearch, GlobalSearchResultItem } from '../../services/apiCommon/apiSearch';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<GlobalSearchResultItem['category'], string> = {
  ORDER: 'Commandes',
  PROFORMA: 'Proformas',
  CONTACT: 'Clients / Contacts',
  LEAD: 'Prospects',
  SUPPLIER: 'Fournisseurs',
  EMPLOYEE: 'Employés',
  ITEM: 'Catalogue & Stock',
  EQUIPMENT: 'Équipements',
};

const categoryIcons: Record<GlobalSearchResultItem['category'], React.ReactNode> = {
  ORDER: <ShoppingBag className="w-4 h-4 text-[var(--info)]" />,
  PROFORMA: <FileText className="w-4 h-4 text-[var(--brand-text)]" />,
  CONTACT: <Users className="w-4 h-4 text-[var(--success)]" />,
  LEAD: <Sparkles className="w-4 h-4 text-[var(--warning)]" />,
  SUPPLIER: <Truck className="w-4 h-4 text-slate-600" />,
  EMPLOYEE: <Briefcase className="w-4 h-4 text-slate-600" />,
  ITEM: <Package className="w-4 h-4 text-slate-600" />,
  EQUIPMENT: <Wrench className="w-4 h-4 text-slate-600" />,
};

interface QuickRoute {
  label: string;
  to: string;
  roles?: UserRole[];
}

const QUICK_ROUTES: QuickRoute[] = [
  { label: 'Cockpit Analyses', to: '/dashboard/', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR] },
  { label: 'Analyse des ventes', to: '/dashboard/sales-analytics', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL] },
  { label: 'CRM & Devis', to: '/dashboard/crm', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.FINANCIAL_DIRECTOR, UserRole.SECRETARY] },
  { label: 'Proformas', to: '/dashboard/proforma', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.FINANCIAL_DIRECTOR] },
  { label: 'Commandes & Facturation', to: '/dashboard/sales', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.CAISSIER, UserRole.FINANCIAL_DIRECTOR, UserRole.PRODUCTION_DIRECTOR] },
  { label: 'Caisse & Encaissements', to: '/dashboard/caisse', roles: [UserRole.CAISSIER] },
  { label: 'Production & Atelier', to: '/dashboard/production', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR] },
  { label: 'Achats & Fournisseurs', to: '/dashboard/purchasing', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PURCHASING_MANAGER, UserRole.FINANCIAL_DIRECTOR] },
  { label: 'Stocks & Mouvements', to: '/dashboard/stock', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PURCHASING_MANAGER, UserRole.FINANCIAL_DIRECTOR] },
  { label: 'Trésorerie & Flux (Décaissements)', to: '/dashboard/disbursement', roles: [UserRole.SUPER_ADMIN] },
  { label: 'Dépenses & Engagements (Finance)', to: '/dashboard/finance', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER] },
  { label: 'Comptabilité & Fiscalité', to: '/dashboard/accountings', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR] },
  { label: 'Ressources Humaines', to: '/dashboard/hr', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER] },
  { label: 'Secrétariat', to: '/dashboard/secretariat', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SECRETARY] },
  { label: 'Configuration', to: '/dashboard/configuration', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'Audit & Santé Système', to: '/dashboard/governance/audit', roles: [UserRole.SUPER_ADMIN] },
  { label: 'Sécurité personnelle (2FA)', to: '/dashboard/security' },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeRole = user?.activeRole ?? user?.userRole;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Raccourci Ctrl+K / Cmd+K : 0 ms d'animation (regle stricte Raycast / DESIGN.md)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const items = await globalSearch(q);
        if (!cancelled) setResults(items);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const allowedRoutes = QUICK_ROUTES.filter(
    (r) => !r.roles || (activeRole && r.roles.includes(activeRole)),
  );

  const grouped = results.reduce<Record<string, GlobalSearchResultItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const goTo = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/35 z-[1100]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl bg-white border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-2xl z-[1101] overflow-hidden focus:outline-none"
        >
          <Dialog.Title className="sr-only">Recherche globale</Dialog.Title>
          <Command shouldFilter={query.trim().length < 2}>
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]">
              <Search className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Rechercher une commande, proforma, client, employé ou aller vers..."
                className="w-full text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none bg-transparent"
              />
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono-code bg-[var(--muted)] border border-[var(--border)] rounded text-[var(--muted-foreground)]">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[380px] overflow-y-auto p-2 space-y-2">
              <Command.Empty className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                {isSearching ? 'Recherche en cours…' : 'Aucun résultat trouvé.'}
              </Command.Empty>

              {Object.entries(grouped).map(([category, items]) => (
                <Command.Group
                  key={category}
                  heading={categoryLabels[category as GlobalSearchResultItem['category']] || category}
                  className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--muted-foreground)]"
                >
                  {items.map((item) => (
                    <Command.Item
                      key={`${item.category}-${item.id}`}
                      value={`${item.title} ${item.subtitle}`}
                      onSelect={() => goTo(item.route)}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm cursor-pointer aria-selected:bg-[var(--brand-soft)] aria-selected:text-[var(--foreground)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {categoryIcons[item.category]}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)] truncate tabular-nums">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}

              <Command.Group
                heading="Navigation rapide"
                className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--muted-foreground)]"
              >
                {allowedRoutes.map((r) => (
                  <Command.Item
                    key={r.to}
                    value={r.label}
                    onSelect={() => goTo(r.to)}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm cursor-pointer aria-selected:bg-[var(--brand-soft)] aria-selected:text-[var(--foreground)]"
                  >
                    <span className="font-medium">{r.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CommandPalette;
