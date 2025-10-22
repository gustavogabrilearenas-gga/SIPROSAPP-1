'use client';

import NextLink from 'next/link';
import { Box, Heading, Stack, Text, Button } from '@chakra-ui/react';

import StateError from '@/components/feedback/StateError';
import { useUser } from '@/lib/rbac';

const AdminCatalogosPage = () => {
  const user = useUser();

  if (!user || user.role !== 'admin') {
    return (
      <StateError
        title="No autorizado"
        message="Solo los administradores pueden gestionar catálogos."
        actionLabel="Volver al inicio"
        actionHref="/"
      />
    );
  }

  return (
    <Stack spacing={6}>
      <Heading size="lg">Catálogos maestros</Heading>
      <Text color="gray.600">
        Definí centros de trabajo, líneas, materiales críticos y demás datos maestros necesarios para el MES.
      </Text>
      <Box bg="white" borderRadius="lg" p={6} shadow="sm" borderWidth="1px" borderColor="gray.100">
        <Stack spacing={3}>
          <Heading size="md">Próxima iteración</Heading>
          <Text color="gray.600">La administración de catálogos se publicará junto con la integración al ERP.</Text>
          <Button as={NextLink} href="/admin/usuarios" colorScheme="blue" variant="outline" alignSelf="flex-start">
            Gestionar usuarios
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default AdminCatalogosPage;
