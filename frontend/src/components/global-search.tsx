'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Package, Wrench, AlertTriangle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchResponse, SearchResult } from '@/types/models'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Abrir/cerrar búsqueda con Ctrl+K o Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Buscar después de un delay
  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }

    const timer = setTimeout(() => {
      performSearch()
    }, 500) // Delay de 500ms

    return () => clearTimeout(timer)
  }, [query])

  const performSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = await api.buscarGlobal(query.trim())
      setResults(response)
    } catch (err: any) {
      console.error('Error in global search:', err)
      setError('Error al realizar la búsqueda')
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // Navegar a la página correspondiente
    if (result.tipo === 'lote') {
      router.push('/lotes')
    } else if (result.tipo === 'orden_trabajo') {
      router.push('/mantenimiento')
    } else if (result.tipo === 'incidente') {
      router.push('/incidentes')
    }
    setIsOpen(false)
    setQuery('')
    setResults(null)
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'lote':
        return <Package className="w-5 h-5 text-blue-600" />
      case 'orden_trabajo':
        return <Wrench className="w-5 h-5 text-green-600" />
      case 'incidente':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Search className="w-5 h-5 text-gray-600" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'lote':
        return 'Lote'
      case 'orden_trabajo':
        return 'Orden de Trabajo'
      case 'incidente':
        return 'Incidente'
      default:
        return tipo
    }
  }

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      // Lotes
      PLANIFICADO: 'bg-blue-100 text-blue-800',
      EN_PROCESO: 'bg-yellow-100 text-yellow-800',
      PAUSADO: 'bg-orange-100 text-orange-800',
      FINALIZADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800',
      LIBERADO: 'bg-purple-100 text-purple-800',
      // Órdenes
      ABIERTA: 'bg-blue-100 text-blue-800',
      ASIGNADA: 'bg-purple-100 text-purple-800',
      PAUSADA: 'bg-orange-100 text-orange-800',
      COMPLETADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
      // Incidentes
      ABIERTO: 'bg-blue-100 text-blue-800',
      EN_INVESTIGACION: 'bg-yellow-100 text-yellow-800',
      ACCION_CORRECTIVA: 'bg-orange-100 text-orange-800',
      CERRADO: 'bg-green-100 text-green-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">Buscar... </span>
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded">
          Ctrl+K
        </kbd>
      </button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-4 border-b flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lotes, órdenes de trabajo, incidentes..."
              className="flex-1 outline-none text-lg"
            />
            {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
            {error && (
              <div className="p-8 text-center text-red-600">
                {error}
              </div>
            )}

            {!query.trim() && !results && (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Escribe para buscar en lotes, órdenes de trabajo e incidentes</p>
                <p className="text-sm mt-2">Utiliza <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-200 rounded">Ctrl+K</kbd> para abrir la búsqueda</p>
              </div>
            )}

            {results && results.resultados.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron resultados para "{query}"</p>
              </div>
            )}

            {results && results.resultados.length > 0 && (
              <div className="p-4">
                {/* Resumen */}
                <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-medium">{results.total} resultados</span>
                  {results.tipos.lotes > 0 && (
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {results.tipos.lotes} lotes
                    </span>
                  )}
                  {results.tipos.ordenes_trabajo > 0 && (
                    <span className="flex items-center gap-1">
                      <Wrench className="w-4 h-4" />
                      {results.tipos.ordenes_trabajo} OTs
                    </span>
                  )}
                  {results.tipos.incidentes > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {results.tipos.incidentes} incidentes
                    </span>
                  )}
                </div>

                {/* Lista de resultados */}
                <div className="space-y-2">
                  {results.resultados.map((result, index) => (
                    <motion.div
                      key={`${result.tipo}-${result.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultClick(result)}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getIcon(result.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {getTipoLabel(result.tipo)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getEstadoBadgeColor(result.estado)}`}>
                              {result.estado_display}
                            </span>
                            {result.severidad && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                {result.severidad}
                              </span>
                            )}
                            {result.prioridad && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                                {result.prioridad}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1 truncate">
                            {result.titulo}
                          </h4>
                          <p className="text-sm text-gray-600 mb-1">
                            {result.subtitulo}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {result.snippet}
                          </p>
                          <span className="text-xs text-gray-400 mt-1 block">
                            {new Date(result.fecha).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 font-semibold bg-white border border-gray-200 rounded">↑</kbd>
                <kbd className="px-2 py-1 font-semibold bg-white border border-gray-200 rounded">↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 font-semibold bg-white border border-gray-200 rounded">Enter</kbd>
                seleccionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 font-semibold bg-white border border-gray-200 rounded">Esc</kbd>
                cerrar
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
