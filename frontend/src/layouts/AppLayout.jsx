import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ChevronDown,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Workflow,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Task history', icon: Activity },
]

function getPageTitle(pathname) {
  if (pathname.startsWith('/projects/')) return 'Project workspace'
  if (pathname === '/projects') return 'Projects'
  if (pathname.startsWith('/tasks/new')) return 'Create task'
  if (pathname.startsWith('/tasks/')) return 'Task details'
  if (pathname === '/tasks') return 'Task history'
  return 'Overview'
}

function AppLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const name = user?.name || user?.email || 'TaskFlow user'
  const initials = name.slice(0, 1).toUpperCase()

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const closeMenu = () => setMobileOpen(false)

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={closeMenu} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Workflow size={21} /></div>
          <span>taskflow<span className="brand-ai">.ai</span></span>
          <button className="mobile-close icon-button" aria-label="Close navigation" onClick={closeMenu}>
            <X size={20} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">T</div>
          <div className="workspace-copy">
            <strong>Personal workspace</strong>
            <span>Free plan</span>
          </div>
          <ChevronDown size={16} />
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMenu}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <CircleHelp size={18} />
            <span>Need a hand?</span>
            <span className="help-dot" />
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div className="user-copy">
              <strong>{name}</strong>
              <span>{user?.email || 'Signed in'}</span>
            </div>
            <button className="icon-button logout-button" title="Log out" onClick={signOut}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
              <Menu size={21} />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span><span className="breadcrumb-separator">/</span>
              <strong>{getPageTitle(location.pathname)}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="topbar-create" onClick={() => navigate('/tasks/new')}>
              <Plus size={16} /> New task
            </button>
            <button className="icon-button topbar-logout" type="button" aria-label="Log out" title="Log out" onClick={signOut}>
              <LogOut size={17} />
            </button>
            <div className="user-avatar topbar-avatar" aria-label={name}>{initials}</div>
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
        <footer className="app-footer">
          <span>TaskFlow AI <span className="footer-dot">·</span> Async work, in focus.</span>
          <span>Statuses update automatically while you work.</span>
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
