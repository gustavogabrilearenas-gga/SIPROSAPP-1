'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Settings,
  ArrowLeft,
  Briefcase,
  Beaker,
  Layers,
  Clock,
  MapPin,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'
import { useMasterConfigAccess } from '@/hooks/use-master-config-access'
import { AccessDenied } from '@/components/access-denied'

type MasterModule = {
  name: string
  href: string
  icon: LucideIcon
  description: string
}

const masterModules: MasterModule[] = [
  {
    name: 'Productos',
    href: '/configuraciones-maestras/productos',
    icon: Briefcase,
    description: 'Gestiona los productos y sus detalles.',
  },
  {
    name: 'Fórmulas',
    href: '/configuraciones-maestras/formulas',
    icon: Beaker,
    description: 'Define las fórmulas de los productos.',
  },
  {
    name: 'Etapas de Producción',
    href: '/configuraciones-maestras/etapas-produccion',
    icon: Layers,
    description: 'Configura las etapas del proceso productivo.',
  },
  {
    name: 'Turnos',
    href: '/configuraciones-maestras/turnos',
    icon: Clock,
    description: 'Define los turnos de trabajo.',
  },
  {
    name: 'Ubicaciones',
    href: '/configuraciones-maestras/ubicaciones',
    icon: MapPin,
    description: 'Administra las ubicaciones de la planta.',
  },
]

const disabledModuleHrefs = new Set(['/configuraciones-maestras/paradas'])

const modules = masterModules.filter((module) => !disabledModuleHrefs.has(module.href))

export default function ConfiguracionPage() {
  const router = useRouter()
  const { status } = useMasterConfigAccess()

  const handleCardClick = (href: string) => {
    router.push(href)
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-blue-600">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verificando permisos...
      </div>
    )
  }

  if (status === 'forbidden') {
    return (
      <AccessDenied description="Sólo supervisores y administradores pueden acceder a las configuraciones maestras." />
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>

              <h1 className="text-4xl font-bold text-gray-900 flex items-center space-x-3">
                <Settings className="h-10 w-10 text-gray-700" />
                <span>Configuraciones Maestras</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Administra las configuraciones base del sistema.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, index) => (
              <motion.div
                key={mod.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
                  onClick={() => handleCardClick(mod.href)}
                >
                  <CardHeader className="flex flex-row items-center space-x-4">
                    <mod.icon className="h-8 w-8 text-gray-700" />
                    <CardTitle className="text-xl">{mod.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-600">{mod.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}