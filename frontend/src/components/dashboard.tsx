'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Package,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Activity as ActivityIcon,
  Settings,
  Users,
  FileText,
  Shield,
  MapPin
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { api } from '@/lib/api'
import NotificationCenter from '@/components/notification-center'
import GlobalSearch from '@/components/global-search'

// Datos mock para gráficos dinámicos
const productionData = [
  { name: 'Lun', produccion: 1200, eficiencia: 85 },
  { name: 'Mar', produccion: 1350, eficiencia: 88 },
  { name: 'Mié', produccion: 1100, eficiencia: 82 },
  { name: 'Jue', produccion: 1450, eficiencia: 92 },
  { name: 'Vie', produccion: 1300, eficiencia: 87 },
  { name: 'Sáb', produccion: 800, eficiencia: 78 },
  { name: 'Dom', produccion: 0, eficiencia: 0 }
]

const machineStatusData = [
  { name: 'Operativas', value: 85, color: '#22c55e' },
  { name: 'Mantenimiento', value: 10, color: '#f59e0b' },
  { name: 'Fuera de Servicio', value: 5, color: '#ef4444' }
]

const efficiencyTrend = [
  { time: '00:00', eficiencia: 75 },
  { time: '04:00', eficiencia: 82 },
  { time: '08:00', eficiencia: 88 },
  { time: '12:00', eficiencia: 92 },
  { time: '16:00', eficiencia: 87 },
  { time: '20:00', eficiencia: 80 }
]

export function Dashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const defaultData = {
    totalProduccion: 8450,
    lotesActivos: 12,
    ordenesMantenimiento: 3,
    alertasPendientes: 2,
    eficienciaPromedio: 87.5,
    tiempoMedioReparacion: 2.3,
    oee: 78.5,
    disponibilidad: 94.2
  }
  
  const [realTimeData, setRealTimeData] = useState(defaultData)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const stats = await api.getDashboardStats()
        setRealTimeData(stats)
        setError(null)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('No se pudo conectar con el backend. Mostrando datos de ejemplo.')
        // Use mock data as fallback
        setRealTimeData({
          totalProduccion: 8450,
          lotesActivos: 12,
          ordenesMantenimiento: 3,
          alertasPendientes: 2,
          eficienciaPromedio: 87.5,
          tiempoMedioReparacion: 2.3,
          oee: 78.5,
          disponibilidad: 94.2
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  // Update current time
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeTimer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Animado */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SIPROSA MES
              </h1>
              <p className="text-gray-600 font-medium">
                Centro de Control de Manufactura Farmacéutica
              </p>
            </motion.div>

            {/* Búsqueda Global */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <GlobalSearch />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              {/* Sistema de Notificaciones */}
              <NotificationCenter />
              
              {user && (
                <button 
                  onClick={() => router.push('/perfil')}
                  className="text-right border-r border-gray-300 pr-4 hover:opacity-70 transition-opacity"
                >
                  <p className="text-sm text-gray-500">Usuario</p>
                  <p className="font-semibold text-gray-900">{user.full_name || user.username}</p>
                  <p className="text-xs text-blue-600">Mi Perfil →</p>
                </button>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Última actualización</p>
                <p className="font-mono text-sm font-semibold text-blue-600">
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
              <Badge className={error ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-green-100 text-green-800 border-green-200 animate-pulse"}>
                <Activity className="w-3 h-3 mr-1" />
                {error ? "Datos de ejemplo" : "Sistema Conectado"}
              </Badge>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  onClick={() => router.push('/configuracion/usuarios')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Usuarios
                </Button>
              )}
              <Button 
                variant="outline" 
                className="bg-white/50 backdrop-blur-sm"
                onClick={() => router.push('/configuracion')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button 
                variant="outline" 
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">
              ¡Centro de Control Activo!
            </h2>
            <p className="text-blue-100 text-lg">
              Monitoreo en tiempo real de todos los procesos de producción farmacéutica
            </p>
            <div className="flex items-center mt-4 space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Producción: Óptima</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Calidad: Estándar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Eficiencia: 87.5%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards Animados */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: 'Producción Diaria',
              value: realTimeData.totalProduccion ? realTimeData.totalProduccion.toLocaleString() : '0',
              subtitle: 'Unidades producidas',
              icon: Package,
              color: 'from-emerald-500 to-teal-600',
              bgColor: 'bg-emerald-50',
              iconColor: 'text-emerald-600'
            },
            {
              title: 'Lotes Activos',
              value: realTimeData.lotesActivos,
              subtitle: 'En proceso',
              icon: Clock,
              color: 'from-blue-500 to-indigo-600',
              bgColor: 'bg-blue-50',
              iconColor: 'text-blue-600'
            },
            {
              title: 'Mantenimiento',
              value: realTimeData.ordenesMantenimiento,
              subtitle: 'Órdenes pendientes',
              icon: Wrench,
              color: 'from-amber-500 to-orange-600',
              bgColor: 'bg-amber-50',
              iconColor: 'text-amber-600'
            },
            {
              title: 'Alertas',
              value: realTimeData.alertasPendientes,
              subtitle: 'Requieren atención',
              icon: AlertTriangle,
              color: 'from-red-500 to-rose-600',
              bgColor: 'bg-red-50',
              iconColor: 'text-red-600'
            }
          ].map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {kpi.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {kpi.value}
                  </div>
                  <p className="text-sm text-gray-500">
                    {kpi.subtitle}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Gráficos y Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Producción */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Producción Semanal</span>
                </CardTitle>
                <CardDescription>
                  Unidades producidas por día de la semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={productionData}>
                    <defs>
                      <linearGradient id="productionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="produccion"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#productionGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Estado de Máquinas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  <span>Estado de Máquinas</span>
                </CardTitle>
                <CardDescription>
                  Distribución actual del estado de los equipos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={machineStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {machineStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-6 mt-4">
                  {machineStatusData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Eficiencia en Tiempo Real */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-8"
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5 text-green-600" />
                <span>Eficiencia en Tiempo Real</span>
              </CardTitle>
              <CardDescription>
                Seguimiento continuo de la eficiencia operacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsLineChart data={efficiencyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis domain={[70, 100]} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="eficiencia"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Módulos del Sistema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Módulos del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[
              { icon: Package, text: 'Productos', color: 'from-blue-500 to-blue-600', route: '/productos' },
              { icon: FileText, text: 'Fórmulas', color: 'from-purple-500 to-purple-600', route: '/formulas' },
              { icon: Settings, text: 'Máquinas', color: 'from-gray-500 to-gray-600', route: '/maquinas' },
              { icon: Package, text: 'Lotes', color: 'from-green-500 to-green-600', route: '/lotes' },
              { icon: Activity, text: 'Inventario', color: 'from-indigo-500 to-indigo-600', route: '/inventario' },
              { icon: Wrench, text: 'Mantenimiento', color: 'from-amber-500 to-amber-600', route: '/mantenimiento' },
              { icon: AlertTriangle, text: 'Incidentes', color: 'from-red-500 to-red-600', route: '/incidentes' },
              { icon: AlertCircle, text: 'Desviaciones', color: 'from-orange-500 to-orange-600', route: '/desviaciones' },
              { icon: Shield, text: 'Control Calidad', color: 'from-emerald-500 to-emerald-600', route: '/control-calidad' },
              { icon: BarChart3, text: 'KPIs', color: 'from-teal-500 to-teal-600', route: '/kpis' },
              { icon: MapPin, text: 'Ubicaciones', color: 'from-cyan-500 to-cyan-600', route: '/ubicaciones' },
              { icon: Clock, text: 'Turnos', color: 'from-violet-500 to-violet-600', route: '/turnos' },
              { icon: Activity, text: 'Etapas', color: 'from-pink-500 to-pink-600', route: '/etapas-produccion' },
              { icon: Clock, text: 'Paradas', color: 'from-rose-500 to-rose-600', route: '/paradas' },
              { icon: FileText, text: 'Documentos', color: 'from-slate-500 to-slate-600', route: '/configuracion' },
            ].map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => router.push(module.route)}
                  className={`w-full h-32 rounded-xl bg-gradient-to-br ${module.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-3 group`}
                >
                  <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <module.icon className="w-8 h-8" />
                  </div>
                  <span className="font-semibold text-sm">{module.text}</span>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Acciones Rápidas y Estado del Sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Acciones Rápidas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
          >
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Acciones Rápidas</CardTitle>
                <CardDescription className="text-blue-700">
                  Operaciones críticas del flujo de trabajo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Package, text: 'Nuevo Lote', color: 'bg-blue-500', route: '/lotes' },
                  { icon: Wrench, text: 'Mantenimiento', color: 'bg-amber-500', route: '/mantenimiento' },
                  { icon: AlertTriangle, text: 'Reportar Incidente', color: 'bg-red-500', route: '/incidentes' },
                  { icon: TrendingUp, text: 'Ver KPIs', color: 'bg-green-500', route: '/kpis' }
                ].map((action, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={() => router.push(action.route)}
                      className="w-full justify-start bg-white/80 hover:bg-white text-gray-700 border border-blue-200"
                    >
                      <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      {action.text}
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Estado del Sistema */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>Métricas de Rendimiento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">OEE Global</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${realTimeData.oee}%` }}
                          transition={{ duration: 1, delay: 1.5 }}
                        ></motion.div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {realTimeData.oee}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Disponibilidad</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${realTimeData.disponibilidad}%` }}
                          transition={{ duration: 1, delay: 1.7 }}
                        ></motion.div>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {realTimeData.disponibilidad}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Eficiencia</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-purple-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${realTimeData.eficienciaPromedio}%` }}
                          transition={{ duration: 1, delay: 1.9 }}
                        ></motion.div>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">
                        {realTimeData.eficienciaPromedio}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actividad Reciente */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
          >
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center space-x-2">
                  <ActivityIcon className="h-5 w-5" />
                  <span>Actividad en Tiempo Real</span>
                </CardTitle>
                <CardDescription className="text-green-700">
                  Eventos recientes del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      icon: CheckCircle,
                      color: 'bg-green-500',
                      title: 'Lote PROD-2025-001 completado',
                      time: 'Hace 2 minutos',
                      badge: 'Completado',
                      badgeColor: 'bg-green-100 text-green-800'
                    },
                    {
                      icon: Clock,
                      color: 'bg-yellow-500',
                      title: 'Mantenimiento programado iniciado',
                      time: 'Hace 15 minutos',
                      badge: 'En Proceso',
                      badgeColor: 'bg-yellow-100 text-yellow-800'
                    },
                    {
                      icon: AlertCircle,
                      color: 'bg-orange-500',
                      title: 'Alerta de calidad detectada',
                      time: 'Hace 1 hora',
                      badge: 'Atención',
                      badgeColor: 'bg-orange-100 text-orange-800'
                    }
                  ].map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 + index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className={`p-2 rounded-full ${activity.color}`}>
                        <activity.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <Badge className={activity.badgeColor}>
                        {activity.badge}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
