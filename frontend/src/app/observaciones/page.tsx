'use client';

import { Box, Heading, Stack, Text } from '@chakra-ui/react';

import StateEmpty from '@/components/feedback/StateEmpty';

const ObservacionesPage = () => (
  <Stack spacing={6}>
    <Heading size="lg">Observaciones</Heading>
    <Text color="gray.600">Centralizá hallazgos, oportunidades de mejora y comentarios de auditorías de piso.</Text>
    <Box>
      <StateEmpty
        title="Sin observaciones cargadas"
        description="En la próxima versión podrás documentar observaciones y asignarlas a responsables."
      />
    </Box>
  </Stack>
);

export default ObservacionesPage;
