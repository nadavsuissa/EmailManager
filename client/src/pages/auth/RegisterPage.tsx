import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  SimpleGrid,
  Link,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from 'react-icons/fi';

import { loginSuccess } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { RegisterCredentials } from '../../types/user';

// API service to be implemented
import { registerUser } from '../../services/authService';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { loading } = useSelector((state: RootState) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterCredentials & { confirmPassword: string }>();
  
  const password = watch('password', '');
  const toggleShowPassword = () => setShowPassword(!showPassword);
  
  const onSubmit = async (data: RegisterCredentials & { confirmPassword: string }) => {
    try {
      // Remove confirm password before sending to API
      const { confirmPassword, ...registerData } = data;
      
      // Register the user
      const user = await registerUser(registerData);
      
      // Dispatch login success to store the user data
      dispatch(loginSuccess(user));
      
      toast({
        title: t('auth.registerSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      
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
    <Box maxW="lg" mx="auto" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        <Heading textAlign="center" mb={2}>{t('auth.register')}</Heading>
        <Text textAlign="center" color="gray.500" mb={4}>
          {t('app.tagline')}
        </Text>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.displayName}>
              <FormLabel htmlFor="displayName">{t('auth.displayName')}</FormLabel>
              <InputGroup>
                <Input
                  id="displayName"
                  placeholder={t('auth.displayName')}
                  {...register('displayName', {
                    required: t('errors.required'),
                    minLength: {
                      value: 2,
                      message: t('errors.required'),
                    },
                  })}
                />
                <InputRightElement>
                  <Icon as={FiUser} color="gray.400" />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.displayName?.message}</FormErrorMessage>
            </FormControl>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
              <FormControl isInvalid={!!errors.firstName}>
                <FormLabel htmlFor="firstName">{t('auth.firstName')}</FormLabel>
                <Input
                  id="firstName"
                  placeholder={t('auth.firstName')}
                  {...register('firstName')}
                />
                <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.lastName}>
                <FormLabel htmlFor="lastName">{t('auth.lastName')}</FormLabel>
                <Input
                  id="lastName"
                  placeholder={t('auth.lastName')}
                  {...register('lastName')}
                />
                <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
            
            <FormControl isInvalid={!!errors.hebrewName}>
              <FormLabel htmlFor="hebrewName">{t('auth.hebrewName')}</FormLabel>
              <Input
                id="hebrewName"
                placeholder={t('auth.hebrewName')}
                dir="rtl"
                {...register('hebrewName')}
              />
              <FormErrorMessage>{errors.hebrewName?.message}</FormErrorMessage>
            </FormControl>
            
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
                      value: 8,
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
            
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel htmlFor="confirmPassword">{t('auth.confirmPassword')}</FormLabel>
              <InputGroup>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  {...register('confirmPassword', {
                    required: t('errors.required'),
                    validate: (value) => 
                      value === password || t('errors.passwordsDontMatch'),
                  })}
                />
                <InputRightElement>
                  <Box as="button" type="button" onClick={toggleShowPassword}>
                    <Icon as={showPassword ? FiEyeOff : FiEye} color="gray.400" />
                  </Box>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
            </FormControl>
            
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isFullWidth
              isLoading={loading}
              loadingText={t('common.loading')}
              mt={2}
            >
              {t('auth.register')}
            </Button>
          </VStack>
        </form>
        
        <Text textAlign="center" mt={4}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link as={RouterLink} to="/login" color="brand.500" fontWeight="semibold">
            {t('auth.login')}
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default RegisterPage; 