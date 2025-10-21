"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Box bg="white" p={10} rounded="lg" shadow="md" maxW="2xl" w="full">
        <Stack spacing={4}>
          <Heading size="lg">Panel principal</Heading>
          <Text color="gray.600">
            Has iniciado sesión correctamente. Aquí aparecerá el contenido del dashboard en futuras fases.
          </Text>
          <Button onClick={handleLogout} colorScheme="red" isLoading={loading} alignSelf="flex-start">
            Salir
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
