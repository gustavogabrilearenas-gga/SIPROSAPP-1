'use client';

import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, Stack } from '@chakra-ui/react';
import NextLink from 'next/link';

interface Props {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
}

const StateError = ({
  title = 'Ocurrió un problema',
  message,
  actionLabel,
  actionHref,
  onRetry,
}: Props) => (
  <Stack spacing={4} align="center">
    <Alert status="error" borderRadius="md" variant="subtle" flexDirection="column" textAlign="center" py={6}>
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={2} mb={1} fontSize="lg">
        {title}
      </AlertTitle>
      <AlertDescription maxWidth="sm">{message}</AlertDescription>
    </Alert>
    {actionLabel && actionHref && (
      <Button as={NextLink} href={actionHref} colorScheme="blue">
        {actionLabel}
      </Button>
    )}
    {onRetry && (
      <Button onClick={onRetry} colorScheme="blue" variant="outline">
        Reintentar
      </Button>
    )}
  </Stack>
);

export default StateError;
