import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';

// Port fidele de Frontend_GMO/components/Dropdown.tsx (gmo-plateforme-commerciale-241025),
// seule la couleur d'accent change (#c6e911 au lieu de #F7941F - identite CaapMedia).

interface SidebarDropdownItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarDropdownProps {
  title: string;
  icon: React.ReactNode;
  items: SidebarDropdownItem[];
  isCollapsed: boolean;
  currentPath: string;
  onItemClick?: () => void;
}

const SidebarDropdown: React.FC<SidebarDropdownProps> = ({
  title,
  icon,
  items,
  isCollapsed,
  currentPath,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Le routeur TanStack normalise les URLs sans slash final par defaut
  // (trailingSlash: 'never', jamais configure explicitement dans router.tsx)
  // - currentPath vaut donc '/dashboard', jamais '/dashboard/', meme si
  // item.to (utilise pour la navigation) garde le slash.
  const isItemActive = (item: SidebarDropdownItem) =>
    item.to === '/dashboard/' ? currentPath === '/dashboard' : currentPath.startsWith(item.to);
  const hasActiveItem = items.some(isItemActive);

  useEffect(() => {
    if (hasActiveItem && !isCollapsed) {
      setIsOpen(true);
    }
  }, [hasActiveItem, isCollapsed]);

  const handleClick = () => {
    if (isCollapsed && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.top, left: rect.right + 8 });
    }
    setIsOpen((v) => !v);
  };

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const menuElement = document.querySelector('[data-sidebar-dropdown-menu="true"]');
        if (menuElement && !menuElement.contains(target)) {
          setIsOpen(false);
        } else if (!menuElement) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = () => {
    onItemClick?.();
  };

  return (
    <div className="relative">
      {isCollapsed ? (
        <button
          ref={buttonRef}
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-xl transition-all duration-200 ${
            hasActiveItem || isOpen ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className={`transition-colors duration-200 ${hasActiveItem || isOpen ? 'text-[#c6e911]' : 'text-gray-400'}`}>
            {icon}
          </span>
        </button>
      ) : (
        <div className="relative group">
          <button
            onClick={handleClick}
            className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 px-4 justify-between ${
              hasActiveItem || isOpen ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`shrink-0 transition-colors duration-200 ${hasActiveItem || isOpen ? 'text-[#c6e911]' : 'text-gray-400 group-hover:text-white'}`}>
                {icon}
              </span>
              <span className="font-medium text-sm tracking-wide truncate">{title}</span>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-all duration-200 ${isOpen ? 'rotate-180 text-[#c6e911]' : 'text-gray-500'}`} />
          </button>
        </div>
      )}

      {/* Menu déroulant inline (sidebar dépliée) */}
      {isOpen && !isCollapsed && (
        <div className="mt-1 ml-4 space-y-0.5 animate-slideDown">
          {items.map((item) => {
            const isActive = isItemActive(item);
            return (
              <div key={item.to} className="relative group">
                <Link
                  to={item.to}
                  onClick={handleItemClick}
                  className={`w-full flex items-center gap-3 py-2 px-4 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#c6e911]/20 to-transparent text-white border-l-2 border-[#c6e911]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`transition-colors duration-200 ${isActive ? 'text-[#c6e911]' : 'text-gray-500 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Menu contextuel via Portal (sidebar repliée) */}
      {isOpen && isCollapsed && createPortal(
        <div
          data-sidebar-dropdown-menu="true"
          className="fixed w-64 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white rounded-lg shadow-xl z-[9999] border border-white/5"
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        >
          <div className="px-3 py-2 border-b border-gray-700">
            <span className="block text-xs font-semibold text-[#c6e911] truncate">{title}</span>
          </div>
          <div className="py-1">
            {items.map((item) => {
              const isActive = isItemActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => { setIsOpen(false); handleItemClick(); }}
                  className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 ${
                    isActive ? 'bg-[#c6e911]/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`transition-colors duration-200 ${isActive ? 'text-[#c6e911]' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SidebarDropdown;
