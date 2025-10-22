'use client';

import { Box, Heading, Stack, VStack, Link as ChakraLink, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Only, useUser, type Role } from '@/lib/rbac';

const baseLinks: Array<{ label: string; href: string; roles: Role[] }> = [
  { label: 'Producción', href: '/produccion', roles: ['operario', 'supervisor', 'admin'] },
  { label: 'Mantenimiento', href: '/mantenimiento', roles: ['operario', 'supervisor', 'admin'] },
  { label: 'Incidentes', href: '/incidentes', roles: ['operario', 'supervisor', 'admin'] },
  { label: 'Observaciones', href: '/observaciones', roles: ['operario', 'supervisor', 'admin'] },
  { label: 'Dashboards', href: '/dashboards', roles: ['supervisor', 'admin'] },
];

const adminLinks = [
  { label: 'Usuarios', href: '/admin/usuarios' },
  { label: 'Catálogos', href: '/admin/catalogos' },
];

const Sidebar = () => {
  const user = useUser();

  return (
    <Box as="nav" bg="gray.900" color="white" w={{ base: 'full', md: 72 }} p={6} minH="100vh">
      <Stack spacing={8}>
        <Heading size="md" textTransform="uppercase" letterSpacing="wide">
          SIPROSA MES
        </Heading>
        <VStack align="stretch" spacing={2}>
          {baseLinks
            .filter((link) => (user ? link.roles.includes(user.role) : link.roles.includes('operario')))
            .map((link) => (
              <ChakraLink
                as={NextLink}
                key={link.href}
                href={link.href}
                _hover={{ textDecoration: 'none', bg: 'whiteAlpha.200' }}
                borderRadius="md"
                px={3}
                py={2}
              >
                {link.label}
              </ChakraLink>
            ))}
        </VStack>
        <Only role="admin">
          <Box>
            <Text fontSize="sm" textTransform="uppercase" color="gray.400" mb={2}>
              Administración
            </Text>
            <VStack align="stretch" spacing={2}>
              {adminLinks.map((link) => (
                <ChakraLink
                  as={NextLink}
                  key={link.href}
                  href={link.href}
                  _hover={{ textDecoration: 'none', bg: 'whiteAlpha.200' }}
                  borderRadius="md"
                  px={3}
                  py={2}
                >
                  {link.label}
                </ChakraLink>
              ))}
            </VStack>
          </Box>
        </Only>
      </Stack>
    </Box>
  );
};

export default Sidebar;
