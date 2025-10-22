'use client';

import { Box, Heading, Stack, Text } from '@chakra-ui/react';

import StateEmpty from '@/components/feedback/StateEmpty';

const MantenimientoPage = () => (
  <Stack spacing={6}>
    <Heading size="lg">Mantenimiento</Heading>
    <Text color="gray.600">Gestioná planes preventivos, correctivos y backlog de tareas técnicas.</Text>
    <Box>
      <StateEmpty
        title="Planificador en construcción"
        description="La planificación de mantenimiento se habilitará en la siguiente iteración."
      />
    </Box>
  </Stack>
);

export default MantenimientoPage;
