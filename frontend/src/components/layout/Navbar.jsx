import { Link, useNavigate } from 'react-router-dom'
import { Plus, LogOut } from 'lucide-react'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono font-semibold text-base select-none">
          <span className="text-accent text-lg">&gt;_</span>
          <span className="text-zinc-100">RepoLaunch</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-zinc-500 hidden sm:block truncate max-w-[160px]">
              {user.email}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate('/new')}>
            <Plus size={14} />
            New Project
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout} title="Sign out">
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </nav>
  )
}
