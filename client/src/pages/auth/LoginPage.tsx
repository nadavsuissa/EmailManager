import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  HStack,
  Checkbox,
  Link,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { UserCredentials } from '../../types/user';

// API service to be implemented
import { loginWithEmailPassword, loginWithGoogle } from '../../services/authService';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCredentials>();
  
  const toggleShowPassword = () => setShowPassword(!showPassword);
  
  const onSubmit = async (data: UserCredentials) => {
    try {
      dispatch(loginStart());
      const user = await loginWithEmailPassword(data);
      dispatch(loginSuccess(user));
      toast({
        title: t('auth.loginSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      dispatch(loginFailure(errorMessage));
      toast({
        title: t('auth.authError'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      dispatch(loginStart());
      const user = await loginWithGoogle();
      dispatch(loginSuccess(user));
      toast({
        title: t('auth.loginSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      dispatch(loginFailure(errorMessage));
      toast({
        title: t('auth.authError'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box maxW="md" mx="auto" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        <Heading textAlign="center" mb={2}>{t('auth.login')}</Heading>
        <Text textAlign="center" color="gray.500" mb={4}>
          {t('app.tagline')}
        </Text>
        
        <Button
          leftIcon={<Icon as={FcGoogle} boxSize={5} />}
          variant="outline"
          size="lg"
          colorScheme="gray"
          isFullWidth
          onClick={handleGoogleLogin}
          isLoading={loading}
          loadingText={t('common.loading')}
        >
          {t('auth.loginWithGoogle')}
        </Button>
        
        <HStack>
          <Divider />
          <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">{t('auth.or')}</Text>
          <Divider />
        </HStack>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel htmlFor="email">{t('auth.email')}</FormLabel>
              <InputGroup>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email', {
                    required: t('errors.required'),
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: t('errors.invalidEmail'),
                    },
                  })}
                />
                <InputRightElement>
                  <Icon as={FiMail} color="gray.400" />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.password}>
              <FormLabel htmlFor="password">{t('auth.password')}</FormLabel>
              <InputGroup>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  {...register('password', {
                    required: t('errors.required'),
                    minLength: {
                      value: 6,
                      message: t('errors.passwordTooShort'),
                    },
                  })}
                />
                <InputRightElement>
                  <Box as="button" type="button" onClick={toggleShowPassword}>
                    <Icon as={showPassword ? FiEyeOff : FiEye} color="gray.400" />
                  </Box>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            
            <HStack justify="space-between" w="100%">
              <Checkbox>{t('auth.rememberMe')}</Checkbox>
              <Link as={RouterLink} to="/forgot-password" color="brand.500" fontSize="sm">
                {t('auth.forgotPassword')}
              </Link>
            </HStack>
            
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isFullWidth
              isLoading={loading}
              loadingText={t('common.loading')}
            >
              {t('auth.login')}
            </Button>
          </VStack>
        </form>
        
        <Text textAlign="center" mt={4}>
          {t('auth.dontHaveAccount')}{' '}
          <Link as={RouterLink} to="/register" color="brand.500" fontWeight="semibold">
            {t('auth.register')}
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default LoginPage; 