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
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="gray.900"
      bgGradient="linear(to-b, gray.900, blue.900)"
      px={4}
    >
      <Box
        bg="gray.800"
        p={10}
        rounded="xl"
        shadow="2xl"
        w="full"
        maxW="md"
        borderWidth={1}
        borderColor="blue.500"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "xl",
          padding: "2px",
          background: "linear-gradient(45deg, blue.400, purple.500)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        <Stack spacing={8} as="form" onSubmit={handleSubmit}>
          <Stack spacing={3} textAlign="center">
            <Heading size="lg" bgGradient="linear(to-r, blue.400, purple.400)" bgClip="text">
              SIPROSA MES
            </Heading>
            <Text fontSize="lg" color="gray.400" fontWeight="medium">
              Sistema de Gestión de Manufactura
            </Text>
            <Text color="gray.500" fontSize="sm">
              Inicia sesión para continuar
            </Text>
          </Stack>

          {error && (
            <Alert status="error" borderRadius="md" bg="red.900" color="white">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel color="gray.300">Usuario</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                bg="gray.700"
                border="none"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ bg: "gray.600" }}
                _focus={{ bg: "gray.600", borderColor: "blue.400" }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="gray.300">Contraseña</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                bg="gray.700"
                border="none"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ bg: "gray.600" }}
                _focus={{ bg: "gray.600", borderColor: "blue.400" }}
              />
            </FormControl>
          </Stack>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            fontSize="md"
            isLoading={loading}
            loadingText="Ingresando"
            bgGradient="linear(to-r, blue.400, purple.500)"
            _hover={{
              bgGradient: "linear(to-r, blue.500, purple.600)",
            }}
            _active={{
              bgGradient: "linear(to-r, blue.600, purple.700)",
            }}
          >
            Ingresar
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
}
