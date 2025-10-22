'use client';

import { Center, Spinner as ChakraSpinner, type SpinnerProps } from '@chakra-ui/react';

const Spinner = (props: SpinnerProps) => (
  <Center minH="200px">
    <ChakraSpinner size="xl" color="blue.400" thickness="4px" {...props} />
  </Center>
);

export default Spinner;
