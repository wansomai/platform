'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/ui.store'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const notificationStyles = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    iconColor: 'text-green-400'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    iconColor: 'text-red-400'
  },
  info: {
    icon: AlertCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    iconColor: 'text-green-400'
  }
}

export function Notifications() {
  const { notifications, removeNotification } = useUIStore()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 min-w-[320px] max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const style = notificationStyles[notification.type]
          const Icon = style.icon

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`
                ${style.bgColor} ${style.textColor} ${style.borderColor}
                border rounded-lg shadow-lg p-4 flex items-start
              `}
            >
              <Icon className={`${style.iconColor} h-5 w-5 mt-0.5 mr-3 flex-shrink-0`} />
              
              <div className="flex-1 mr-2">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>

              <button
                onClick={() => removeNotification(notification.id)}
                className={`
                  ${style.textColor} opacity-70 hover:opacity-100
                  transition-opacity focus:outline-none
                `}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}