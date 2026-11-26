import { useLocation } from 'react-router-dom'
import { Home, TrendingUp, DollarSign, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigationItems = [
  { path: '/', icon: Home, label: 'Home', activeIcon: Home },
  { path: '/invest', icon: TrendingUp, label: 'Invest', activeIcon: TrendingUp },
  { path: '/earnings', icon: DollarSign, label: 'Earnings', activeIcon: DollarSign },
  { path: '/account', icon: User, label: 'Account', activeIcon: User }
]

const BottomNavigation = () => {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 safe-area-bottom" aria-label="Main navigation">
      <div className="flex justify-around">
        {navigationItems.map(({ path, icon: Icon, label, activeIcon: ActiveIcon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? 'text-primary-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} aria-hidden="true" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation