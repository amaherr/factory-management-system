import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getFilteredNavigation } from '../lib/permissions';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import {
  Factory,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  TrendingUp,
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  AlertCircle,
  Settings,
  Box,
  Boxes,
  History,
  Download,
  Plus,
  FileText,
  Receipt,
  Undo,
  UserCog,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

type NavigationItem = ReturnType<typeof getFilteredNavigation>[number];

const iconMap: Record<string, any> = {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  AlertCircle,
  Bell,
  Settings,
  Box,
  Boxes,
  History,
  Factory,
  Download,
  Plus,
  FileText,
  Receipt,
  Undo,
  UserCog,
  Sliders,
  ShieldAlert,
};

function getSectionForPath(navigation: NavigationItem[], pathname: string) {
  const matchingGroup = navigation.find(
    (item) => item.children && item.children.some((child) => pathname.startsWith(child.path)),
  );

  return matchingGroup?.path ?? null;
}

export function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const { t: tCommon } = useTranslation('common');
  const { t: tNav } = useTranslation('nav');
  const navigation = useMemo(() => getFilteredNavigation(user?.roles ?? []), [user?.roles]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(
    () => getSectionForPath(navigation, location.pathname) ?? '/dashboards',
  );

  if (!user) return null;

  useEffect(() => {
    refreshUnreadCount();

    // Poll for new notifications every 10 seconds
    const interval = setInterval(refreshUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useEffect(() => {
    const activeSection = getSectionForPath(navigation, location.pathname);
    if (activeSection && activeSection !== expandedSection) {
      setExpandedSection(activeSection);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExpanded = (path: string) => {
    setExpandedSection((prev) => (prev === path ? null : path));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top App Bar */}
      <header className="h-16 border-b border-[--border-light] bg-white flex items-center justify-between px-6 shadow-sm">
        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <Factory
            className="size-6"
            style={{ color: 'var(--primary-500)' }}
          />
          <span
            className="font-semibold text-lg"
            style={{ color: 'var(--text-heading)' }}
          >
            Factory System
          </span>
        </Link>

        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
              style={{ color: 'var(--text-muted)' }}
            />
            <Input
              type="text"
              placeholder={tCommon('search')}
              className="pl-10 border-[--border-default]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <Badge
                style={{ backgroundColor: 'var(--accent-500)', color: 'var(--text-on-dark)' }}
                className="absolute -top-1 -right-1 size-5 rounded-full p-0 flex items-center justify-center text-xs border-0"
              >
                {unreadCount > 10 ? '10+' : unreadCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2"
              >
                <User className="size-4" />
                <span>{user.name}</span>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="font-medium">{user.name}</span>
                    <div
                      className="text-xs font-normal"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {user.email}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                      >
                        {tCommon(`role_${role}`)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                {tCommon('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="w-64 border-r"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}
        >
          <div className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const Icon = iconMap[item.icon];
                const isExpanded = expandedSection === item.path;
                const hasChildren = item.children && item.children.length > 0;
                const isPageActive = location.pathname === item.path;

                return (
                  <div key={item.path}>
                    {hasChildren ? (
                      <button
                        onClick={() => toggleExpanded(item.path)}
                        className="w-full flex items-center gap-2 rounded-md px-3 py-2 transition-colors duration-200"
                        style={{
                          color: 'var(--text-on-dark)',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon className="size-4" />
                        <span className="flex-1 text-left">{tNav(item.label.toLowerCase())}</span>
                        <span
                          className="transition-transform duration-300 ease-out"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        >
                          <ChevronRight className="size-4" />
                        </span>
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                        style={{
                          color: 'var(--text-on-dark)',
                          backgroundColor: isPageActive ? 'var(--sidebar-hover)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isPageActive)
                            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isPageActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon className="size-4" />
                        <span>{tNav(item.label.toLowerCase())}</span>
                      </Link>
                    )}

                    {hasChildren && (
                      <div
                        className="ml-4 grid overflow-hidden transition-all duration-300 ease-out"
                        style={{
                          gridTemplateRows: isExpanded ? '1fr' : '0fr',
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? '0.25rem' : '0',
                        }}
                      >
                        <div className="min-h-0 space-y-1">
                          {item.children?.map((child) => {
                            const ChildIcon = iconMap[child.icon];
                            const isChildActive =
                              location.pathname === child.path ||
                              location.pathname.startsWith(`${child.path}/`);
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200"
                                style={{
                                  color: 'var(--text-on-dark)',
                                  opacity: isChildActive ? 1 : 0.85,
                                  backgroundColor: isChildActive
                                    ? 'var(--sidebar-hover)'
                                    : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isChildActive
                                    ? 'var(--sidebar-hover)'
                                    : 'transparent';
                                  e.currentTarget.style.opacity = isChildActive ? '1' : '0.85';
                                }}
                              >
                                <ChildIcon className="size-4" />
                                <span>{tNav(child.label.toLowerCase())}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
