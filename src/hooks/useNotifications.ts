import { useUIStore } from '@/store/ui.store'

export const useNotifications = () => {
  const { addNotification, removeNotification } = useUIStore()

  const notify = {
    success: (message: string) => addNotification('success', message),
    error: (message: string) => addNotification('error', message),
    info: (message: string) => addNotification('info', message)
  }

  return {
    notify,
    removeNotification
  }
}