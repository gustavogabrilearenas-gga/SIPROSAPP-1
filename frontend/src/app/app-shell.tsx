'use client';

import { ReactNode, useCallback } from 'react';
import { Box, Button, Flex, HStack, IconButton, Spacer, Stack, Text } from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';

import Sidebar from '@/components/layout/Sidebar';
import Spinner from '@/components/feedback/Spinner';
import StateError from '@/components/feedback/StateError';
import { useSession } from '@/lib/auth';
import { isApiError, toUserMessage } from '@/lib/errors';
import { UserProvider } from '@/lib/rbac';

const AppShell = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/login') ?? false;
  const { user, isLoading, error } = useSession({ enabled: !isAuthRoute });

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }, [router]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  if (error || !user) {
    const message = toUserMessage(error ?? { status: 401, message: 'Sesión expirada' });
    const unauthorized = isApiError(error) && error.status === 401;

    return (
      <Flex minH="100vh" align="center" justify="center" p={6}>
        <StateError
          title={unauthorized ? 'Sesión expirada' : 'No se pudo cargar la sesión'}
          message={message}
          actionLabel="Ir al inicio de sesión"
          actionHref="/login"
          onRetry={unauthorized ? undefined : () => router.refresh()}
        />
      </Flex>
    );
  }

  return (
    <UserProvider value={user}>
      <Flex minH="100vh" bg="gray.100">
        <Sidebar />
        <Box flex="1" display="flex" flexDirection="column">
          <Flex
            as="header"
            bg="white"
            borderBottomWidth="1px"
            borderColor="gray.200"
            px={8}
            py={4}
            align="center"
            gap={4}
          >
            <Stack spacing={0}>
              <Text fontWeight="bold">Bienvenido, {user.name ?? 'Usuario'}</Text>
              <Text fontSize="sm" color="gray.500" textTransform="capitalize">
                Rol: {user.role}
              </Text>
            </Stack>
            <Spacer />
            <HStack spacing={3}>
              <Button variant="ghost" onClick={() => router.push('/')}>Inicio</Button>
              <IconButton
                aria-label="Cerrar sesión"
                icon={<FiLogOut />}
                colorScheme="red"
                variant="outline"
                onClick={handleLogout}
              />
            </HStack>
          </Flex>
          <Box as="main" flex="1" p={{ base: 6, md: 10 }}>
            {children}
          </Box>
        </Box>
      </Flex>
    </UserProvider>
  );
};

export default AppShell;
