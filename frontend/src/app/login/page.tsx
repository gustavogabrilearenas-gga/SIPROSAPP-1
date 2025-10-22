'use client';

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (loginData) => {
      return axios.post('/api/token/', loginData);
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.data.access);
      localStorage.setItem('refresh_token', data.data.refresh);
      window.location.href = '/dashboard';
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Invalid credentials',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({ username, password });
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={8} borderWidth="1px" borderRadius="lg">
      <Heading as="h1" size="lg" textAlign="center" mb={8}>
        Login
      </Heading>
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <FormControl id="username">
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          <FormControl id="password">
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            isLoading={mutation.isPending}
          >
            Login
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
