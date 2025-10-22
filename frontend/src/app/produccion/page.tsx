'use client';

import { Box, Heading, Stack, Text } from '@chakra-ui/react';

import StateEmpty from '@/components/feedback/StateEmpty';
import { useUser } from '@/lib/rbac';

const ProduccionPage = () => {
  const user = useUser();

  return (
    <Stack spacing={6}>
      <Heading size="lg">Producción</Heading>
      <Text color="gray.600">
        Panel central para seguimiento de órdenes de producción, eficiencia y cumplimiento.
      </Text>
      <Box>
        <StateEmpty
          title="Próximamente"
          description={`Hola ${user?.name ?? 'equipo'}, pronto vas a visualizar el estado de tus órdenes y KPIs productivos.`}
        />
      </Box>
    </Stack>
  );
};

export default ProduccionPage;
