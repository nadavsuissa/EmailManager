import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Checkbox,
  VStack,
  HStack,
  Box,
  Text,
  Flex,
  Heading,
  useSteps,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiMail, FiServer } from 'react-icons/fi';
import { api } from '../../services/api';
import { AppDispatch } from '../../store/store';

interface EmailAccountFormData {
  name: string;
  email: string;
  server: string;
  port: number;
  username: string;
  password: string;
  useOAuth: boolean;
  useSSL: boolean;
  useIMAPConnection: boolean;
  imapServer?: string;
  imapPort?: number;
  smtpServer?: string;
  smtpPort?: number;
  autoProcessEmails: boolean;
  deleteAfterProcessing: boolean;
}

interface EmailSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (accountId: string) => void;
}

const steps = [
  { title: 'אישי', description: 'פרטים בסיסיים' },
  { title: 'שרת', description: 'הגדרות שרת' },
  { title: 'אישור', description: 'אישור חיבור' },
];

export const EmailSetupWizard: React.FC<EmailSetupWizardProps> = ({ 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [emailProviderPreset, setEmailProviderPreset] = useState('custom');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<EmailAccountFormData>({
    defaultValues: {
      name: '',
      email: '',
      server: '',
      port: 993,
      username: '',
      password: '',
      useOAuth: false,
      useSSL: true,
      useIMAPConnection: true,
      autoProcessEmails: true,
      deleteAfterProcessing: false,
    },
    mode: 'onChange',
  });
  
  const watchUseIMAPConnection = watch('useIMAPConnection');
  const email = watch('email');
  
  // Toggle password visibility
  const toggleShowPassword = () => setShowPassword(!showPassword);
  
  // Handle email provider selection
  const handleProviderChange = (provider: string) => {
    setEmailProviderPreset(provider);
    
    switch (provider) {
      case 'gmail':
        setValue('server', 'imap.gmail.com');
        setValue('port', 993);
        setValue('smtpServer', 'smtp.gmail.com');
        setValue('smtpPort', 587);
        break;
      case 'outlook':
        setValue('server', 'outlook.office365.com');
        setValue('port', 993);
        setValue('smtpServer', 'smtp.office365.com');
        setValue('smtpPort', 587);
        break;
      case 'yahoo':
        setValue('server', 'imap.mail.yahoo.com');
        setValue('port', 993);
        setValue('smtpServer', 'smtp.mail.yahoo.com');
        setValue('smtpPort', 587);
        break;
      // Add other common providers as needed
    }
  };
  
  // Parse username from email if not entered
  const updateUsernameFromEmail = () => {
    if (email && !watch('username')) {
      setValue('username', email);
    }
  };
  
  // Test connection
  const testConnection = async () => {
    setTestingConnection(true);
    try {
      await api.post('/api/email/test-connection', {
        server: watch('server'),
        port: watch('port'),
        username: watch('username'),
        password: watch('password'),
        useSSL: watch('useSSL')
      });
      
      toast({
        title: t('emails.connectionSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: t('emails.connectionFailed'),
        description: error instanceof Error ? error.message : t('common.error'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTestingConnection(false);
    }
  };
  
  // Go to next step
  const nextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  // Go to previous step
  const prevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Submit form
  const onSubmit = async (data: EmailAccountFormData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/email/accounts', data);
      
      toast({
        title: t('emails.accountAdded'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (onSuccess && response.data?.accountId) {
        onSuccess(response.data.accountId);
      }
      
      onClose();
    } catch (error) {
      toast({
        title: t('emails.accountAddFailed'),
        description: error instanceof Error ? error.message : t('common.error'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading size="md">{t('emails.setupEmail')}</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {t('emails.setupDescription')}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Box mb={6}>
            <Stepper index={activeStep} colorScheme="blue" size="sm">
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>
                  
                  <Box flexShrink='0'>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>
                  
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          </Box>
          
          <form id="email-account-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Account Information */}
            {activeStep === 0 && (
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors.name} isRequired>
                  <FormLabel>{t('emails.accountName')}</FormLabel>
                  <Input
                    {...register('name', { 
                      required: t('common.required') as string 
                    })}
                    placeholder={t('emails.accountNamePlaceholder')}
                  />
                  <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.email} isRequired>
                  <FormLabel>{t('emails.emailAddress')}</FormLabel>
                  <InputGroup>
                    <Input
                      {...register('email', { 
                        required: t('common.required') as string,
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: t('errors.invalidEmail') as string
                        }
                      })}
                      placeholder="name@example.com"
                      onBlur={updateUsernameFromEmail}
                    />
                    <InputRightElement>
                      <FiMail color="gray.300" />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('emails.provider')}</FormLabel>
                  <Select 
                    value={emailProviderPreset}
                    onChange={(e) => handleProviderChange(e.target.value)}
                  >
                    <option value="custom">{t('emails.customProvider')}</option>
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="yahoo">Yahoo Mail</option>
                    <option value="yandex">Yandex</option>
                  </Select>
                </FormControl>
              </VStack>
            )}
            
            {/* Step 2: Server Settings */}
            {activeStep === 1 && (
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <Checkbox 
                    id="use-imap" 
                    colorScheme="blue" 
                    mr={3}
                    {...register('useIMAPConnection')}
                  />
                  <FormLabel htmlFor="use-imap" mb={0}>
                    {t('emails.useIMAP')}
                  </FormLabel>
                </FormControl>
                
                {watchUseIMAPConnection ? (
                  <>
                    <FormControl isInvalid={!!errors.server} isRequired>
                      <FormLabel>{t('emails.imapServer')}</FormLabel>
                      <InputGroup>
                        <Input
                          {...register('server', { 
                            required: watchUseIMAPConnection ? t('common.required') as string : false 
                          })}
                          placeholder="imap.example.com"
                        />
                        <InputRightElement>
                          <FiServer color="gray.300" />
                        </InputRightElement>
                      </InputGroup>
                      <FormErrorMessage>{errors.server?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.port} isRequired>
                      <FormLabel>{t('emails.imapPort')}</FormLabel>
                      <Input
                        {...register('port', { 
                          required: watchUseIMAPConnection ? t('common.required') as string : false,
                          valueAsNumber: true
                        })}
                        placeholder="993"
                        type="number"
                      />
                      <FormErrorMessage>{errors.port?.message}</FormErrorMessage>
                    </FormControl>
                  </>
                ) : null}
                
                <FormControl isInvalid={!!errors.smtpServer} isRequired>
                  <FormLabel>{t('emails.smtpServer')}</FormLabel>
                  <InputGroup>
                    <Input
                      {...register('smtpServer', { 
                        required: t('common.required') as string 
                      })}
                      placeholder="smtp.example.com"
                    />
                    <InputRightElement>
                      <FiServer color="gray.300" />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.smtpServer?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.smtpPort} isRequired>
                  <FormLabel>{t('emails.smtpPort')}</FormLabel>
                  <Input
                    {...register('smtpPort', { 
                      required: t('common.required') as string,
                      valueAsNumber: true
                    })}
                    placeholder="587"
                    type="number"
                  />
                  <FormErrorMessage>{errors.smtpPort?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.username} isRequired>
                  <FormLabel>{t('emails.username')}</FormLabel>
                  <Input
                    {...register('username', { 
                      required: t('common.required') as string 
                    })}
                    placeholder={email || t('emails.usernamePlaceholder')}
                  />
                  <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.password} isRequired>
                  <FormLabel>{t('emails.password')}</FormLabel>
                  <InputGroup>
                    <Input
                      {...register('password', { 
                        required: t('common.required') as string 
                      })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                        variant="ghost"
                        size="sm"
                        onClick={toggleShowPassword}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>
                
                <Button 
                  mt={4} 
                  colorScheme="blue" 
                  variant="outline"
                  onClick={testConnection}
                  isLoading={testingConnection}
                >
                  {t('emails.testConnection')}
                </Button>
              </VStack>
            )}
            
            {/* Step 3: Advanced Settings & Confirmation */}
            {activeStep === 2 && (
              <VStack spacing={4} align="stretch">
                <Heading size="sm" mb={2}>{t('emails.processingSettings')}</Heading>
                
                <FormControl display="flex" alignItems="center">
                  <Checkbox 
                    id="auto-process" 
                    colorScheme="blue" 
                    mr={3}
                    {...register('autoProcessEmails')}
                  />
                  <FormLabel htmlFor="auto-process" mb={0}>
                    {t('emails.autoProcess')}
                  </FormLabel>
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <Checkbox 
                    id="delete-after" 
                    colorScheme="blue" 
                    mr={3}
                    {...register('deleteAfterProcessing')}
                  />
                  <FormLabel htmlFor="delete-after" mb={0}>
                    {t('emails.deleteAfterProcessing')}
                  </FormLabel>
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <Checkbox 
                    id="use-ssl" 
                    colorScheme="blue" 
                    mr={3}
                    {...register('useSSL')}
                    defaultChecked
                  />
                  <FormLabel htmlFor="use-ssl" mb={0}>
                    {t('emails.useSSL')}
                  </FormLabel>
                </FormControl>
                
                <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
                  <Heading size="sm" mb={3}>{t('emails.connectionSummary')}</Heading>
                  <VStack align="stretch" spacing={2} fontSize="sm">
                    <Flex justify="space-between">
                      <Text fontWeight="bold">{t('emails.accountName')}:</Text>
                      <Text>{watch('name')}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">{t('emails.emailAddress')}:</Text>
                      <Text>{watch('email')}</Text>
                    </Flex>
                    {watchUseIMAPConnection && (
                      <>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">{t('emails.imapServer')}:</Text>
                          <Text>{watch('server')}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">{t('emails.imapPort')}:</Text>
                          <Text>{watch('port')}</Text>
                        </Flex>
                      </>
                    )}
                    <Flex justify="space-between">
                      <Text fontWeight="bold">{t('emails.smtpServer')}:</Text>
                      <Text>{watch('smtpServer')}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">{t('emails.smtpPort')}:</Text>
                      <Text>{watch('smtpPort')}</Text>
                    </Flex>
                  </VStack>
                </Box>
              </VStack>
            )}
          </form>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>
            {t('common.cancel')}
          </Button>
          
          {activeStep > 0 && (
            <Button variant="outline" mr={3} onClick={prevStep} isDisabled={loading}>
              {t('common.back')}
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button 
              colorScheme="blue" 
              onClick={nextStep}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button 
              colorScheme="blue" 
              type="submit"
              form="email-account-form"
              isLoading={loading}
              loadingText={t('common.saving')}
            >
              {t('emails.connect')}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 