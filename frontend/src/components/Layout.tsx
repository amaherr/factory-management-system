import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
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
import { ScrollArea } from './ui/scroll-area';
import {
  Factory,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
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
} from 'lucide-react';
import { mockNotifications } from '../lib/mockData';

const iconMap: Record<string, any> = {
  LayoutDashboard,
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
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const navigation = getFilteredNavigation(user.roles);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  return (
    <div className="h-screen flex flex-col">
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
              placeholder="Search products, orders, invoices, batches, customers..."
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
                {unreadCount}
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
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name}</span>
                  <span
                    className="text-xs font-normal"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {user.email}
                  </span>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Change Password</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="w-64 border-r"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}
        >
          <ScrollArea className="h-full">
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const Icon = iconMap[item.icon];
                const isExpanded = expandedItems.includes(item.path);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.path}>
                    {hasChildren ? (
                      <button
                        onClick={() => toggleExpanded(item.path)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                        style={{
                          color: 'var(--text-on-dark)',
                          backgroundColor: isExpanded ? 'var(--sidebar-hover)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded)
                            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon className="size-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                        style={{ color: 'var(--text-on-dark)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    )}

                    {hasChildren && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children?.map((child) => {
                          const ChildIcon = iconMap[child.icon];
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
                              style={{ color: 'var(--text-on-dark)', opacity: 0.85 }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                                e.currentTarget.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.opacity = '0.85';
                              }}
                            >
                              <ChildIcon className="size-4" />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
