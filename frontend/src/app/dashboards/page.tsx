'use client';

import NextLink from 'next/link';
import { Box, Heading, Stack, Text, Button } from '@chakra-ui/react';

import StateError from '@/components/feedback/StateError';
import { can, useUser } from '@/lib/rbac';

const DashboardsPage = () => {
  const user = useUser();

  if (!user || !can('view', 'dashboard', user)) {
    return (
      <StateError
        title="No autorizado"
        message="No contás con permisos para acceder a los tableros."
        actionLabel="Volver al inicio"
        actionHref="/"
      />
    );
  }

  return (
    <Stack spacing={6}>
      <Heading size="lg">Dashboards</Heading>
      <Text color="gray.600">
        Acá vas a encontrar indicadores clave de desempeño y métricas operativas en tiempo real.
      </Text>
      <Box bg="white" borderRadius="lg" p={6} shadow="sm" borderWidth="1px" borderColor="gray.100">
        <Stack spacing={3}>
          <Heading size="md">Próximos pasos</Heading>
          <Text color="gray.600">Los tableros se integrarán con los datos productivos en fases posteriores.</Text>
          <Button as={NextLink} href="/" colorScheme="blue" alignSelf="flex-start">
            Volver al inicio
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default DashboardsPage;
