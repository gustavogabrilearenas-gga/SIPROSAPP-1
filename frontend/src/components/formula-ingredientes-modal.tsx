'use client'

import { useEffect, useState, useMemo } from 'react'
import { AnimatePresence, motion } from '@/lib/motion'
import { stopClickPropagation } from '@/lib/dom'
import { X, Package, AlertTriangle, Loader2 } from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import { showError } from '@/components/common/toast-utils'

interface FormulaIngredientesModalProps {
  isOpen: boolean
  onClose: () => void
  formulaId: number | null
}

interface FormulaResumen {
  id: number
  producto_nombre: string
  version: string
}

interface FormulaIngrediente {
  id: number
  insumo: number
  insumo_codigo: string
  insumo_nombre: string
  cantidad: number
  unidad: string
  es_critico: boolean
  orden: number
}

interface FormulaIngredientesResponse {
  formula: FormulaResumen
  insumos: FormulaIngrediente[]
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)

export default function FormulaIngredientesModal({ isOpen, onClose, formulaId }: FormulaIngredientesModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formula, setFormula] = useState<FormulaResumen | null>(null)
  const [ingredientes, setIngredientes] = useState<FormulaIngrediente[]>([])

  useEffect(() => {
    if (!isOpen || !formulaId) {
      return
    }

    const loadIngredientes = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.get<FormulaIngredientesResponse>(`/formulas/${formulaId}/insumos/`)
        setFormula(response.formula)
        setIngredientes(Array.isArray(response.insumos) ? response.insumos : [])
      } catch (err) {
        const { message } = handleApiError(err)
        const errorMessage = message || 'No se pudieron obtener los insumos de la fórmula'
        setError(errorMessage)
        showError('Error al cargar insumos', errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    void loadIngredientes()
  }, [formulaId, isOpen])

  const titulo = useMemo(() => {
    if (!formula) return 'Insumos de la Fórmula'
    return `${formula.producto_nombre} · ${formula.version}`
  }, [formula])

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={stopClickPropagation}
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-5 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                {titulo}
              </h2>
              <p className="text-sm text-purple-100">Detalle de materias primas y excipientes asignados</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            ) : ingredientes.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No hay insumos asociados a esta fórmula.
              </div>
            ) : (
              <div className="space-y-4">
                {ingredientes.map((ingrediente) => (
                  <div
                    key={ingrediente.id}
                    className="border border-gray-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm text-gray-500">#{ingrediente.orden.toString().padStart(2, '0')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {ingrediente.insumo_codigo} · {ingrediente.insumo_nombre}
                      </p>
                      {ingrediente.es_critico && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
                          <AlertTriangle className="w-3 h-3" /> Insumo crítico
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Cantidad requerida</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatNumber(ingrediente.cantidad)} <span className="text-sm text-gray-600">{ingrediente.unidad}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
