'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/protected-route'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Package,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import FormulaFormModal from '@/components/formula-form-modal'
import DataState from '@/components/common/data-state'
import { showError } from '@/components/common/toast-utils'

interface Formula {
  id: number
  producto_nombre: string
  version: string
  fecha_vigencia_desde: string
  fecha_vigencia_hasta: string | null
  rendimiento_teorico: number
  tiempo_estimado_horas: number
  aprobada_por_nombre: string
  fecha_aprobacion: string
  observaciones: string
  activa: boolean
  insumos_count: number
}

export default function FormulasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedFormulaId, setSelectedFormulaId] = useState<number | null>(null)

  useEffect(() => {
    fetchFormulas()
  }, [])

  const fetchFormulas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getFormulas()
      setFormulas(response.results || response)
    } catch (error: any) {
      const message = error?.message || 'No se pudieron obtener las fórmulas'
      setError(message)
      showError('Error al cargar fórmulas', message)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    fetchFormulas()
  }

  const filteredFormulas = formulas.filter(f =>
    f.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.aprobada_por_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getVersionColor = (version: string) => {
    if (version.startsWith('v1')) return 'bg-green-100 text-green-800'
    if (version.startsWith('v2')) return 'bg-blue-100 text-blue-800'
    if (version.startsWith('v3')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const isVigente = (fechaHasta: string | null) => {
    if (!fechaHasta) return true
    return new Date(fechaHasta) > new Date()
  }

  const hasError = Boolean(error)
  const dataStateError = hasError ? `Error al cargar fórmulas${error ? `: ${error}` : ''}` : null
  const isEmptyState = !loading && !hasError && filteredFormulas.length === 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-8 h-8 text-purple-600" />
                    Gestión de Fórmulas
                  </h1>
                  <p className="text-gray-600">Recetas de producción farmacéutica</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {
                    setSelectedFormulaId(null)
                    setIsFormOpen(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Fórmula
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por producto, versión o aprobado por..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          <DataState
            loading={loading}
            error={dataStateError}
            empty={isEmptyState}
            emptyMessage={
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No se encontraron fórmulas</p>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFormulas.map((formula, index) => (
                <motion.div
                  key={formula.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getVersionColor(formula.version)}>
                              {formula.version}
                            </Badge>
                            {isVigente(formula.fecha_vigencia_hasta) && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Vigente
                              </Badge>
                            )}
                            {!formula.activa && (
                              <Badge className="bg-gray-100 text-gray-800">Inactiva</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg font-bold mb-1">
                            {formula.producto_nombre}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Rendimiento</p>
                            <p className="font-bold text-purple-600">{formula.rendimiento_teorico}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Tiempo Est.</p>
                            <p className="font-medium">{formula.tiempo_estimado_horas}h</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Insumos</p>
                            <p className="font-medium">{formula.insumos_count}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Aprobada por</p>
                            <p className="font-medium">{formula.aprobada_por_nombre}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 border-t pt-2">
                          <p>Vigencia: {new Date(formula.fecha_vigencia_desde).toLocaleDateString()}</p>
                          {formula.fecha_vigencia_hasta && (
                            <p>Hasta: {new Date(formula.fecha_vigencia_hasta).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {/* TODO: View ingredients */}}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Insumos
                          </Button>
                          {(user?.is_superuser || user?.is_staff) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFormulaId(formula.id)
                                setIsFormOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </DataState>
        </main>

        {/* Form Modal */}
        <FormulaFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          formulaId={selectedFormulaId}
          onSuccess={handleFormSuccess}
        />
      </div>
    </ProtectedRoute>
  )
}
