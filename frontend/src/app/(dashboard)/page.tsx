'use client';

import NextLink from 'next/link';
import { Box, Heading, LinkBox, LinkOverlay, SimpleGrid, Stack, Text } from '@chakra-ui/react';

import { can, useUser } from '@/lib/rbac';

const links = [
  { label: 'Producción', description: 'Seguimiento de órdenes y rendimiento en planta.', href: '/produccion' },
  { label: 'Mantenimiento', description: 'Programación y control de mantenimiento preventivo.', href: '/mantenimiento' },
  { label: 'Incidentes', description: 'Registro y seguimiento de incidentes críticos.', href: '/incidentes' },
  { label: 'Observaciones', description: 'Notas y hallazgos de auditorías de piso.', href: '/observaciones' },
  { label: 'Dashboards', description: 'Indicadores clave de desempeño.', href: '/dashboards', requires: { action: 'view', resource: 'dashboard' } as const },
  { label: 'Administración', description: 'Gestión de usuarios y catálogos.', href: '/admin/usuarios', role: 'admin' as const },
];

const DashboardHome = () => {
  const user = useUser();
  const availableLinks = links.filter((link) => {
    if (!user) return false;
    if (link.role && user.role !== link.role) return false;
    if (link.requires && !can(link.requires.action, link.requires.resource, user)) return false;
    return true;
  });

  return (
    <Stack spacing={8}>
      <Stack spacing={2}>
        <Heading size="lg">Bienvenido a SIPROSA MES</Heading>
        <Text color="gray.600">Seleccioná una sección para comenzar. Tu rol actual es {user?.role}.</Text>
      </Stack>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {availableLinks.map((link) => (
          <LinkBox key={link.href} as="article" borderWidth="1px" borderRadius="lg" bg="white" p={6} shadow="sm">
            <Stack spacing={2}>
              <Heading size="md">
                <LinkOverlay as={NextLink} href={link.href} color="blue.600">
                  {link.label}
                </LinkOverlay>
              </Heading>
              <Text color="gray.600">{link.description}</Text>
            </Stack>
          </LinkBox>
        ))}
      </SimpleGrid>
      {availableLinks.length === 0 && (
        <Box borderRadius="lg" borderWidth="1px" borderStyle="dashed" p={10} textAlign="center" bg="white">
          <Text color="gray.500">Aún no tenés secciones asignadas. Contactá a un administrador.</Text>
        </Box>
      )}
    </Stack>
  );
};

export default DashboardHome;
