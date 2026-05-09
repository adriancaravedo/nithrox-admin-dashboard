import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import { formatRelative } from '../../../lib/utils'
import { useNavigate } from 'react-router-dom'

export default function NotificationsPage() {
  const { notifications, markNotifRead, markAllRead } = useStore()
  const navigate = useNavigate()
  const unread = notifications.filter(n => !n.read).length
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Notificaciones" actions={unread > 0 && <Button size="sm" variant="outline" onClick={markAllRead}>Marcar todas leídas</Button>} />
      <div className="flex-1 overflow-y-auto p-5 max-w-2xl">
        <div className="bg-background border border-border rounded-lg divide-y divide-border overflow-hidden">
          {notifications.map(n => (
            <div key={n.id} onClick={() => { markNotifRead(n.id); navigate(n.link) }} className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-accent/30 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">{n.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="text-[10px] text-muted-foreground">{formatRelative(n.at)}</p>
                {!n.read && <div className="w-2 h-2 rounded-full bg-foreground" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
