'use client';

import { Box, Heading } from '@chakra-ui/react';
import { useEffect } from 'react';

export default function DashboardPage() {
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <Box maxW="md" mx="auto" mt={8} p={8} borderWidth="1px" borderRadius="lg">
      <Heading as="h1" size="lg" textAlign="center" mb={8}>
        Dashboard
      </Heading>
      <p>Próximamente</p>
    </Box>
  );
}
