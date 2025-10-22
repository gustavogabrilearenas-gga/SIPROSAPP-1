'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';

import StateError from '@/components/feedback/StateError';
import { toUserMessage } from '@/lib/errors';

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const nextPath = searchParams.get('next') ?? '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setServerError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => undefined);
        const message = toUserMessage({
          status: response.status,
          message: (data as { detail?: string })?.detail ?? 'Credenciales inválidas',
        });
        setError(message);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setServerError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bgGradient="linear(to-br, gray.900, blue.900)" px={4}>
      <Box as="form" onSubmit={handleSubmit} bg="gray.800" p={{ base: 8, md: 12 }} rounded="2xl" shadow="2xl" w="full" maxW="lg">
        <Stack spacing={8}>
          <Stack spacing={2} textAlign="center" color="gray.100">
            <Heading size="lg">SIPROSA MES</Heading>
            <Text color="gray.300">Sistema Integrado de Producción</Text>
          </Stack>

          {serverError && (
            <StateError message={serverError} onRetry={() => setServerError(null)} />
          )}

          {error && !serverError && (
            <Alert status="error" borderRadius="md" bg="red.900" color="white">
              <AlertIcon />
              <Box>
                <AlertTitle>Inicio de sesión fallido</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel color="gray.300">Usuario</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                bg="gray.700"
                border="none"
                color="white"
                _placeholder={{ color: 'gray.400' }}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color="gray.300">Contraseña</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                bg="gray.700"
                border="none"
                color="white"
                _placeholder={{ color: 'gray.400' }}
              />
            </FormControl>
          </Stack>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            fontWeight="semibold"
            isLoading={loading}
            loadingText="Ingresando"
          >
            Ingresar
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
};

export default LoginPage;
