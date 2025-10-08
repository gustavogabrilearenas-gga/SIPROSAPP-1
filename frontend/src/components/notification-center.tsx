'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Notificacion } from '@/types/models'
import { api } from '@/lib/api'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Cargar notificaciones cuando se abre
  useEffect(() => {
    if (isOpen) {
      loadNotificaciones()
    }
  }, [isOpen])

  // Cargar contador de no leídas al iniciar y cada 30 segundos
  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000) // 30 segundos
    return () => clearInterval(interval)
  }, [])

  const loadNotificaciones = async () => {
    setLoading(true)
    try {
      const response = await api.getNotificaciones()
      setNotificaciones(Array.isArray(response) ? response : [])
      
      // Actualizar contador de no leídas
      const unread = response?.filter((n: Notificacion) => !n.leida).length || 0
      setUnreadCount(unread)
    } catch (err) {
      console.error('Error loading notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await api.getContadorNotificacionesNoLeidas()
      setUnreadCount(response.no_leidas)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.marcarNotificacionLeida(id)
      setNotificaciones(notificaciones.map(n => 
        n.id === id ? { ...n, leida: true, fecha_leida: new Date().toISOString() } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.marcarTodasNotificacionesLeidas()
      setNotificaciones(notificaciones.map(n => ({ ...n, leida: true, fecha_leida: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-600" />
      case 'ADVERTENCIA':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'CRITICO':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'EXITO':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'INFO':
        return 'bg-blue-50 border-blue-200'
      case 'ADVERTENCIA':
        return 'bg-yellow-50 border-yellow-200'
      case 'CRITICO':
        return 'bg-red-50 border-red-200'
      case 'EXITO':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Ahora'
      if (diffMins < 60) return `Hace ${diffMins} min`
      if (diffHours < 24) return `Hace ${diffHours} h`
      if (diffDays < 7) return `Hace ${diffDays} días`
      
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    } catch {
      return ''
    }
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">Notificaciones</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                    </span>
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Marcar todas leídas
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : notificaciones.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notificaciones.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notif.leida ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getTipoIcon(notif.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-gray-900">
                                {notif.titulo}
                              </h4>
                              {!notif.leida && (
                                <button
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="flex-shrink-0 text-blue-600 hover:text-blue-800"
                                  title="Marcar como leída"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {notif.mensaje}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {formatFecha(notif.fecha_creacion)}
                              </span>
                              {notif.referencia_url && (
                                <a
                                  href={notif.referencia_url}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  onClick={() => setIsOpen(false)}
                                >
                                  Ver detalles →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notificaciones.length > 0 && (
                <div className="p-3 border-t bg-gray-50 text-center">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      // Aquí podrías navegar a una página completa de notificaciones si existiera
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
