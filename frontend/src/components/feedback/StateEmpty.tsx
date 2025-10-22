'use client';

import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

type Props = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

const StateEmpty = ({
  title = 'Sin datos disponibles',
  description = 'Todavía no hay información para mostrar en esta sección.',
  actionLabel,
  actionHref,
}: Props) => (
  <Box bg="white" borderRadius="lg" p={8} shadow="sm">
    <Stack spacing={3} textAlign="center">
      <Heading size="md">{title}</Heading>
      <Text color="gray.600">{description}</Text>
      {actionLabel && actionHref && (
        <Button as={NextLink} href={actionHref} colorScheme="blue" alignSelf="center">
          {actionLabel}
        </Button>
      )}
    </Stack>
  </Box>
);

export default StateEmpty;
