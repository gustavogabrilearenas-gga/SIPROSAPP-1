'use client';

import { Center, Spinner as ChakraSpinner, Stack, Text, type SpinnerProps } from '@chakra-ui/react';

type Props = SpinnerProps & { label?: string };

const Spinner = ({ label, ...props }: Props) => (
  <Center minH="200px">
    <Stack spacing={3} align="center">
      <ChakraSpinner size="xl" color="blue.400" thickness="4px" {...props} />
      {label ? (
        <Text fontSize="sm" color="gray.600">
          {label}
        </Text>
      ) : null}
    </Stack>
  </Center>
);

export default Spinner;
