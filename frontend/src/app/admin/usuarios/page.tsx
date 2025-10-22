'use client';

import NextLink from 'next/link';
import { Box, Heading, Stack, Text, Button } from '@chakra-ui/react';

import StateError from '@/components/feedback/StateError';
import { useUser } from '@/lib/rbac';

const AdminUsuariosPage = () => {
  const user = useUser();

  if (!user || user.role !== 'admin') {
    return (
      <StateError
        title="No autorizado"
        message="Solo los administradores pueden gestionar usuarios."
        actionLabel="Volver al inicio"
        actionHref="/"
      />
    );
  }

  return (
    <Stack spacing={6}>
      <Heading size="lg">Administración de usuarios</Heading>
      <Text color="gray.600">Configura permisos, roles y altas de nuevos colaboradores.</Text>
      <Box bg="white" borderRadius="lg" p={6} shadow="sm" borderWidth="1px" borderColor="gray.100">
        <Stack spacing={3}>
          <Heading size="md">Próxima iteración</Heading>
          <Text color="gray.600">Aquí se incorporará el gestor de usuarios y el enrolamiento de roles RBAC.</Text>
          <Button as={NextLink} href="/admin/catalogos" colorScheme="blue" variant="outline" alignSelf="flex-start">
            Ir a catálogos
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default AdminUsuariosPage;
