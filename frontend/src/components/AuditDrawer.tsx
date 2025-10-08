'use client'

import { useState, useEffect } from 'react'
import { X, History, Filter, Download, Calendar, User, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogAuditoria, AuditoriaResponse } from '@/types/models'
import { api } from '@/lib/api'

interface AuditDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuditDrawer({ isOpen, onClose }: AuditDrawerProps) {
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    modelo: '',
    objeto_id: '',
    usuario: '',
    accion: '',
    desde: '',
    hasta: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadLogs()
    }
  }, [isOpen])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      // Construir filtros
      const params: any = {}
      if (filters.modelo) params.modelo = filters.modelo
      if (filters.objeto_id) params.objeto_id = filters.objeto_id
      if (filters.usuario) params.usuario = filters.usuario
      if (filters.accion) params.accion = filters.accion
      if (filters.desde) params.desde = filters.desde
      if (filters.hasta) params.hasta = filters.hasta

      const response: AuditoriaResponse = await api.getLogsAuditoria(params)
      setLogs(Array.isArray(response?.logs) ? response.logs : [])
    } catch (err: any) {
      console.error('Error loading audit logs:', err)
      setError(err.response?.data?.detail || 'Error al cargar los logs de auditoría')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadLogs()
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    setFilters({
      modelo: '',
      objeto_id: '',
      usuario: '',
      accion: '',
      desde: '',
      hasta: '',
    })
    setTimeout(loadLogs, 100)
  }

  const handleExport = async () => {
    try {
      // Aquí podrías implementar la exportación a CSV
      alert('Exportación en desarrollo')
    } catch (err) {
      console.error('Error exporting logs:', err)
    }
  }

  const getAccionBadgeColor = (accion: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      VIEW: 'bg-yellow-100 text-yellow-800',
    }
    return colors[accion] || 'bg-gray-100 text-gray-800'
  }

  const formatFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return fecha
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <History className="w-7 h-7" />
                  Auditoría del Sistema
                </h2>
                <p className="text-sm text-purple-100">
                  Registro completo de todas las acciones realizadas en el sistema
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={loadLogs}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Actualizar
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b bg-white overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modelo
                      </label>
                      <select
                        value={filters.modelo}
                        onChange={(e) => setFilters({ ...filters, modelo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Todos los modelos</option>
                        <option value="lote">Lote</option>
                        <option value="ordentrabajo">Orden de Trabajo</option>
                        <option value="incidente">Incidente</option>
                        <option value="usuario">Usuario</option>
                        <option value="maquina">Máquina</option>
                        <option value="producto">Producto</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acción
                      </label>
                      <select
                        value={filters.accion}
                        onChange={(e) => setFilters({ ...filters, accion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Todas las acciones</option>
                        <option value="CREATE">Crear</option>
                        <option value="UPDATE">Actualizar</option>
                        <option value="DELETE">Eliminar</option>
                        <option value="LOGIN">Login</option>
                        <option value="LOGOUT">Logout</option>
                        <option value="VIEW">Ver</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Desde
                      </label>
                      <input
                        type="date"
                        value={filters.desde}
                        onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Hasta
                      </label>
                      <input
                        type="date"
                        value={filters.hasta}
                        onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario ID
                      </label>
                      <input
                        type="text"
                        value={filters.usuario}
                        onChange={(e) => setFilters({ ...filters, usuario: e.target.value })}
                        placeholder="ID del usuario"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Objeto ID
                      </label>
                      <input
                        type="text"
                        value={filters.objeto_id}
                        onChange={(e) => setFilters({ ...filters, objeto_id: e.target.value })}
                        placeholder="ID del objeto"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay logs de auditoría que mostrar</p>
                <p className="text-sm mt-2">Intenta ajustar los filtros</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAccionBadgeColor(log.accion)}`}>
                          {log.accion_display}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {log.modelo}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatFecha(log.fecha)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{log.usuario_nombre || `Usuario #${log.usuario}`}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span>{log.objeto_str}</span>
                        <span className="text-gray-400">#{log.objeto_id}</span>
                      </div>

                      {log.cambios && Object.keys(log.cambios).length > 0 && (
                        <details className="mt-3 bg-gray-50 rounded-lg p-3">
                          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                            Ver cambios
                          </summary>
                          <pre className="mt-2 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.cambios, null, 2)}
                          </pre>
                        </details>
                      )}

                      {log.ip_address && (
                        <div className="text-xs text-gray-400 mt-2">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {logs.length > 0 && (
            <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
              Mostrando {logs.length} {logs.length === 1 ? 'registro' : 'registros'} de auditoría
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
