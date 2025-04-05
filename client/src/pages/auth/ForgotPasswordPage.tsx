import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Link,
  useToast,
  Icon,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

// API service to be implemented
import { resetPassword } from '../../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>();
  
  const onSubmit = async (data: { email: string }) => {
    try {
      setLoading(true);
      
      // Call the API to send password reset email
      await resetPassword(data.email);
      
      // Mark email as sent
      setEmailSent(true);
      
      toast({
        title: t('auth.emailVerificationSent'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      
      toast({
        title: t('auth.authError'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box maxW="md" mx="auto" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        <Heading textAlign="center" mb={2}>{t('auth.forgotPassword')}</Heading>
        <Text textAlign="center" color="gray.500" mb={4}>
          {t('auth.forgotPassword')}
        </Text>
        
        {emailSent ? (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            {t('auth.emailVerificationSent')}
          </Alert>
        ) : (
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
              
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                isFullWidth
                isLoading={loading}
                loadingText={t('common.loading')}
                mt={2}
              >
                {t('auth.resetPassword')}
              </Button>
            </VStack>
          </form>
        )}
        
        <Link as={RouterLink} to="/login" color="brand.500" display="flex" alignItems="center">
          <Icon as={FiArrowLeft} mr={2} />
          {t('auth.login')}
        </Link>
      </VStack>
    </Box>
  );
};

export default ForgotPasswordPage; 