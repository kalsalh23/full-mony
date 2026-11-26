import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'
import { useAuth } from '../../contexts/AuthContext'

const Layout = () => {
  const { user } = useAuth()

  if (!user) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      <BottomNavigation />
    </div>
  )
}

export default Layout