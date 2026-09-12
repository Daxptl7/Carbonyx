import React from 'react';
import {
  BriefcaseBusiness,
  Database,
  Globe2,
  LayoutDashboard,
  LucideIcon,
  Search,
  ShieldCheck,
  Sprout,
  Store,
} from 'lucide-react';
import LogoutButton from './LogoutButton';
import { AuthUser } from '../lib/auth';

export type TabKey =
  | 'overview'
  | 'issuer'
  | 'my-registry'
  | 'baseline'
  | 'verifier'
  | 'marketplace'
  | 'portfolio'
  | 'explorer';

export interface SidebarNavItem {
  id: TabKey;
  label: string;
  description?: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const defaultCarbonyxNavItems: SidebarNavItem[] = [
  { id: 'overview', label: 'Overview', description: 'Network activity and controls', icon: LayoutDashboard },
  { id: 'issuer', label: 'Project Studio', description: 'Register and submit evidence', icon: Sprout },
  { id: 'my-registry', label: 'My Registry', description: 'Projects, objections and revisions', icon: Database },
  { id: 'baseline', label: 'Baseline Registry', description: 'Observe and inspect projects', icon: Globe2 },
  { id: 'verifier', label: 'Verifier Portal', description: 'Stake and review anomalies', icon: ShieldCheck },
  { id: 'marketplace', label: 'Marketplace', description: 'Discover and acquire credits', icon: Store },
  { id: 'portfolio', label: 'My Portfolio', description: 'Holdings and retirements', icon: BriefcaseBusiness },
  { id: 'explorer', label: 'Audit Explorer', description: 'Trace protocol provenance', icon: Search }
];

// Inverted corner curves matching the gray sidebar (#1A1A24) and light active tab (#f7f7f7)
function ActiveCurves() {
  return (
    <>
      <div className="absolute right-0 -top-4 h-4 w-4 bg-[#f7f7f7] pointer-events-none">
        <div className="h-full w-full rounded-br-full bg-[#1A1A24]" />
      </div>
      <div className="absolute right-0 -bottom-4 h-4 w-4 bg-[#f7f7f7] pointer-events-none">
        <div className="h-full w-full rounded-tr-full bg-[#1A1A24]" />
      </div>
    </>
  );
}

export interface SidebarProps {
  activeItem: TabKey;
  onSelectItem?: (key: TabKey) => void;
  navItems?: SidebarNavItem[];
  pendingApprovalCount?: number;
  userName?: string;
  authUser?: AuthUser | null;
  roleLabel?: string;
  walletAddress?: string | null;
  isWalletConnected?: boolean;
  showUserDetails?: boolean;
  onLogout?: () => void;
}

export default function Sidebar({
  activeItem,
  onSelectItem,
  navItems = defaultCarbonyxNavItems,
  pendingApprovalCount = 0,
  onLogout
}: SidebarProps) {
  return (
    <aside className="fixed top-[68px] left-0 bottom-0 z-40 hidden h-[calc(100vh-68px)] w-64 flex-col bg-[#1A1A24] text-white lg:flex animate-in fade-in duration-300 border-r border-white/5">
      {/* Navigation section header */}
      <div className="pt-6 pb-2 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">
        Workspace
      </div>

      <nav className="flex-1 overflow-y-auto py-2 pl-4 pr-0 space-y-1.5" aria-label="Workspace navigation">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem && onSelectItem(item.id)}
              className={`group flex w-full items-center justify-between text-left py-3 transition-all duration-200 text-sm ${
                isActive
                  ? "font-bold bg-[#f7f7f7] text-slate-900 rounded-l-full rounded-r-none pl-6 pr-5 relative z-10 mr-0 shadow-[-3px_0_10px_rgba(0,0,0,0.06)]"
                  : "font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full mr-4 px-4"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive ? "text-[#00a699]" : "text-slate-400 group-hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`truncate ${isActive ? 'font-bold text-slate-900' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              </div>

              {/* Pending Approvals / Badges */}
              {(item.id === 'verifier' || item.id === 'issuer') && pendingApprovalCount > 0 && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm mr-2 ${
                    isActive ? "bg-slate-900 text-white font-extrabold" : "bg-amber-500 text-white font-extrabold animate-pulse"
                  }`}
                >
                  {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                </span>
              )}

              {item.badge !== undefined && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm mr-2 ${
                    isActive ? "bg-slate-900 text-white" : "bg-white/10 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && <ActiveCurves />}
            </button>
          );
        })}
      </nav>

      {/* Logout button footer */}
      <div className="p-4 border-t border-white/5 bg-transparent">
        <div className="px-1">
          <LogoutButton variant="sidebar-dark" onLogout={onLogout} />
        </div>
      </div>
    </aside>
  );
}

// Named alias export for compatibility
export { Sidebar as MentorSidebar };
