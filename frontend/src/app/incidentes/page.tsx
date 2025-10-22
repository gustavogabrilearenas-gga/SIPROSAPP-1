'use client';

import { Box, Heading, Stack, Text } from '@chakra-ui/react';

import StateEmpty from '@/components/feedback/StateEmpty';

const IncidentesPage = () => (
  <Stack spacing={6}>
    <Heading size="lg">Incidentes</Heading>
    <Text color="gray.600">Registra y prioriza incidentes críticos para una respuesta rápida.</Text>
    <Box>
      <StateEmpty
        title="Sin incidentes registrados"
        description="Comenzá cargando incidentes desde el botón de alta rápida (disponible en próximas versiones)."
      />
    </Box>
  </Stack>
);

export default IncidentesPage;
