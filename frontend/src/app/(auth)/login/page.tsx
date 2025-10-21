"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUrl = searchParams.get("next") ?? "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data?.detail as string) ?? "No se pudo iniciar sesión");
      } else {
        router.push(nextUrl);
      }
    } catch (err) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.100" px={4}>
      <Box bg="white" p={10} rounded="lg" shadow="md" w="full" maxW="md">
        <Stack spacing={6} as="form" onSubmit={handleSubmit}>
          <Stack spacing={2} textAlign="center">
            <Heading size="lg">Bienvenido a SIPROS</Heading>
            <Text color="gray.600">Inicia sesión para continuar</Text>
          </Stack>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl isRequired>
            <FormLabel>Usuario</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Contraseña</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
            />
          </FormControl>

          <Button type="submit" colorScheme="blue" isLoading={loading} loadingText="Ingresando">
            Ingresar
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
}
