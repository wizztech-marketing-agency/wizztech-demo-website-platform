import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Link2, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search, 
  ChevronRight,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import wizzTechLogo from '../assets/logo/WIZZTECH-logo.png';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/websites', label: 'Protected Websites', icon: ShieldCheck },
  { path: '/dashboard/demo-links', label: 'Demo Links', icon: Link2 },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeItem = NAV_ITEMS.find(item => item.path === currentPath) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-background text-black font-sans antialiased overflow-hidden">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] border-r border-border bg-white h-screen shrink-0 select-none">
        {/* Brand header */}
        <div className="h-[76px] border-b border-border flex items-center px-6 justify-center">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-visible">
            <img src={wizzTechLogo} alt="WizzTech Logo" className="h-16 w-auto object-contain scale-[1.8]" />
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <Link key={item.path} to={item.path} className="relative block">
                {/* Active Indicator Capsule */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-primary/10 border-l-[3px] border-primary rounded-xl"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                
                <span className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative z-10 
                  ${isActive ? 'text-primary' : 'text-secondary hover:text-black hover:bg-black/[0.02]'}`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-secondary/80'}`} />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User section */}
        <div className="p-4 border-t border-border bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-secondary hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 text-secondary/80 hover:text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Nav Drawer Menu */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-md lg:hidden"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-[270px] z-50 bg-white border-r border-border shadow-luxury flex flex-col lg:hidden select-none"
            >
              <div className="h-[76px] border-b border-border flex items-center justify-between px-6">
                <Link to="/dashboard" onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-3 overflow-visible">
                  <img src={wizzTechLogo} alt="WizzTech Logo" className="h-16 w-auto object-contain scale-[1.8]" />
                </Link>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1 rounded-lg border border-border/80 hover:bg-black/5 transition-all text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative
                        ${isActive ? 'bg-primary/10 border-l-[3px] border-primary text-primary' : 'text-secondary hover:text-black hover:bg-black/[0.01]'}`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border bg-white">
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-secondary hover:text-red-500 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Dashboard Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Navbar */}
        <header className="h-[76px] border-b border-border bg-white flex items-center justify-between px-6 shrink-0 relative z-30 select-none">
          
          {/* Mobile nav toggle & title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg border border-border/80 text-secondary hover:bg-black/5"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Current Page Title */}
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-secondary/70">Console</span>
              <ChevronRight className="w-3.5 h-3.5 text-secondary/40" />
              <span className="text-black font-bold">{activeItem.label}</span>
            </div>
          </div>

          {/* Top Actions: Search, Notifications, User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Bar Visual Placeholder */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background max-w-[200px] text-xs text-secondary/60">
              <Search className="w-3.5 h-3.5 text-secondary/40" />
              <span>Search platform...</span>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full border border-border transition-all hover:bg-black/5 text-secondary/80 cursor-pointer ${showNotifications ? 'bg-black/5 text-black' : ''}`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              </button>

              {/* Notification Overlay Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-[300px] border border-border bg-white rounded-luxury shadow-luxury z-40 p-4"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">Recent Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex gap-2.5 items-start">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                          <div>
                            <p className="text-xs font-bold text-black leading-snug">Demo Protection Sync Live</p>
                            <p className="text-[10px] text-secondary">Registry database is currently synced with Supabase.</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <div className="w-6 h-6 rounded-lg bg-black/5 text-secondary flex items-center justify-center shrink-0"><Globe className="w-3.5 h-3.5 text-secondary" /></div>
                          <div>
                            <p className="text-xs font-bold text-black leading-snug">Future Intercept API Ready</p>
                            <p className="text-[10px] text-secondary">Protected websites can query verify session states.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-black text-white hover:bg-black/85 flex items-center justify-center text-xs font-bold transition-all border border-border shadow-soft cursor-pointer"
              >
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'OW'}
              </button>

              {/* Profile Overlay Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-[220px] border border-border bg-white rounded-luxury shadow-luxury z-40 p-1.5"
                    >
                      <div className="px-3.5 py-3 border-b border-border mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/60">Active Session</p>
                        <p className="text-xs font-bold text-black truncate mt-0.5">{user?.email || 'owner@wizztech.com'}</p>
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50/50 rounded-xl transition-all cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout Console</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Content Render Outlet */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
