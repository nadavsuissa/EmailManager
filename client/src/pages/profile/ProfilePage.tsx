import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  VStack,
  HStack,
  SimpleGrid,
  Avatar,
  Text,
  useToast,
  Flex,
  IconButton,
  useColorModeValue,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Switch,
  Select,
} from '@chakra-ui/react';
import { FiCamera, FiUser, FiLock, FiMail, FiSettings } from 'react-icons/fi';

import { RootState } from '../../store';
import { UserProfile } from '../../types/user';
import { updateUserStart, updateUserSuccess, updateUserFailure } from '../../store/slices/authSlice';
import { updateUserProfile, changePassword } from '../../services/authService';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const { currentLanguage } = useSelector((state: RootState) => state.ui);
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<UserProfile>({
    defaultValues: {
      displayName: user?.displayName || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      hebrewName: user?.hebrewName || '',
      photoURL: user?.photoURL || '',
    },
  });
  
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();
  
  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    formState: { errors: settingsErrors },
    reset: resetSettings,
  } = useForm({
    defaultValues: {
      theme: user?.settings?.theme || 'light',
      language: user?.settings?.language || 'he',
      emailNotifications: user?.settings?.emailNotifications || true,
      pushNotifications: user?.settings?.pushNotifications || true,
      defaultView: user?.settings?.defaultView || 'board',
      showCompletedTasks: user?.settings?.showCompletedTasks || true,
    },
  });
  
  // Reset forms when user changes
  useEffect(() => {
    if (user) {
      resetProfile({
        displayName: user.displayName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        hebrewName: user.hebrewName || '',
        photoURL: user.photoURL || '',
      });
      
      resetSettings({
        theme: user.settings?.theme || 'light',
        language: user.settings?.language || currentLanguage,
        emailNotifications: user.settings?.emailNotifications || true,
        pushNotifications: user.settings?.pushNotifications || true,
        defaultView: user.settings?.defaultView || 'board',
        showCompletedTasks: user.settings?.showCompletedTasks || true,
      });
    }
  }, [user, resetProfile, resetSettings, currentLanguage]);
  
  const onProfileSubmit = async (data: UserProfile) => {
    try {
      dispatch(updateUserStart());
      const updatedUser = await updateUserProfile(data);
      dispatch(updateUserSuccess(updatedUser));
      
      toast({
        title: t('settings.profileUpdated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      dispatch(updateUserFailure(errorMessage));
      
      toast({
        title: t('errors.somethingWentWrong'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const onPasswordSubmit = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      
      toast({
        title: t('auth.passwordChangeSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      resetPassword();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      
      toast({
        title: t('errors.somethingWentWrong'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const onSettingsSubmit = async (data: any) => {
    try {
      dispatch(updateUserStart());
      
      const updatedUser = await updateUserProfile({
        settings: data,
      });
      
      dispatch(updateUserSuccess(updatedUser));
      
      toast({
        title: t('settings.settingsUpdated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      dispatch(updateUserFailure(errorMessage));
      
      toast({
        title: t('errors.somethingWentWrong'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'center', md: 'flex-start' }}
          justify="space-between"
          wrap="wrap"
          gap={4}
        >
          <Box>
            <Heading size="lg">{t('settings.profile')}</Heading>
            <Text color="gray.500">{t('settings.updateProfile')}</Text>
          </Box>
        </Flex>
        
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab><Box as={FiUser} mr={2} /> {t('settings.profile')}</Tab>
            <Tab><Box as={FiLock} mr={2} /> {t('settings.security')}</Tab>
            <Tab><Box as={FiSettings} mr={2} /> {t('settings.settings')}</Tab>
          </TabList>
          
          <TabPanels>
            {/* Profile Tab */}
            <TabPanel>
              <Box 
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
              >
                <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
                  <VStack spacing={6} align="stretch">
                    <Flex 
                      direction={{ base: 'column', md: 'row' }}
                      align="center" 
                      gap={6}
                    >
                      <Box position="relative">
                        <Avatar 
                          size="xl" 
                          name={user.displayName} 
                          src={user.photoURL || undefined} 
                        />
                        <IconButton
                          aria-label={t('settings.uploadPhoto')}
                          icon={<FiCamera />}
                          size="sm"
                          isRound
                          position="absolute"
                          bottom="0"
                          right="0"
                          colorScheme="brand"
                        />
                      </Box>
                      
                      <VStack align="flex-start" spacing={1}>
                        <Heading size="md">{user.displayName}</Heading>
                        <Text color="gray.500">{user.email}</Text>
                        {user.hebrewName && (
                          <Text dir="rtl" fontFamily="Rubik">{user.hebrewName}</Text>
                        )}
                      </VStack>
                    </Flex>
                    
                    <Divider />
                    
                    <FormControl isInvalid={!!profileErrors.displayName}>
                      <FormLabel>{t('auth.displayName')}</FormLabel>
                      <Input
                        {...registerProfile('displayName', {
                          required: t('errors.required'),
                        })}
                      />
                      <FormErrorMessage>{profileErrors.displayName?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isInvalid={!!profileErrors.firstName}>
                        <FormLabel>{t('auth.firstName')}</FormLabel>
                        <Input {...registerProfile('firstName')} />
                        <FormErrorMessage>{profileErrors.firstName?.message}</FormErrorMessage>
                      </FormControl>
                      
                      <FormControl isInvalid={!!profileErrors.lastName}>
                        <FormLabel>{t('auth.lastName')}</FormLabel>
                        <Input {...registerProfile('lastName')} />
                        <FormErrorMessage>{profileErrors.lastName?.message}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>
                    
                    <FormControl isInvalid={!!profileErrors.hebrewName}>
                      <FormLabel>{t('auth.hebrewName')}</FormLabel>
                      <Input 
                        {...registerProfile('hebrewName')} 
                        dir="rtl" 
                        fontFamily="Rubik"
                      />
                      <FormErrorMessage>{profileErrors.hebrewName?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <Button 
                      type="submit" 
                      colorScheme="brand" 
                      alignSelf="flex-start"
                      isLoading={loading}
                    >
                      {t('common.save')}
                    </Button>
                  </VStack>
                </form>
              </Box>
            </TabPanel>
            
            {/* Security Tab */}
            <TabPanel>
              <Box 
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
              >
                <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">{t('auth.changePassword')}</Heading>
                    
                    <FormControl isInvalid={!!passwordErrors.currentPassword}>
                      <FormLabel>{t('auth.password')}</FormLabel>
                      <Input
                        type="password"
                        {...registerPassword('currentPassword', {
                          required: t('errors.required'),
                        })}
                      />
                      <FormErrorMessage>{passwordErrors.currentPassword?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!passwordErrors.newPassword}>
                      <FormLabel>{t('auth.newPassword')}</FormLabel>
                      <Input
                        type="password"
                        {...registerPassword('newPassword', {
                          required: t('errors.required'),
                          minLength: {
                            value: 8,
                            message: t('errors.passwordTooShort'),
                          },
                        })}
                      />
                      <FormErrorMessage>{passwordErrors.newPassword?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                      <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                      <Input
                        type="password"
                        {...registerPassword('confirmPassword', {
                          required: t('errors.required'),
                          validate: (value) =>
                            value === watch('newPassword') || t('errors.passwordsDontMatch'),
                        })}
                      />
                      <FormErrorMessage>{passwordErrors.confirmPassword?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <Button 
                      type="submit" 
                      colorScheme="brand" 
                      alignSelf="flex-start"
                    >
                      {t('common.save')}
                    </Button>
                  </VStack>
                </form>
              </Box>
            </TabPanel>
            
            {/* Settings Tab */}
            <TabPanel>
              <Box 
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
              >
                <form onSubmit={handleSubmitSettings(onSettingsSubmit)}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">{t('settings.general')}</Heading>
                    
                    <FormControl>
                      <FormLabel>{t('settings.language')}</FormLabel>
                      <Select {...registerSettings('language')}>
                        <option value="he">עברית</option>
                        <option value="en">English</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>{t('settings.theme')}</FormLabel>
                      <Select {...registerSettings('theme')}>
                        <option value="light">{t('settings.lightTheme')}</option>
                        <option value="dark">{t('settings.darkTheme')}</option>
                        <option value="system">{t('settings.systemTheme')}</option>
                      </Select>
                    </FormControl>
                    
                    <Divider />
                    
                    <Heading size="md">{t('settings.notifications')}</Heading>
                    
                    <FormControl display="flex" alignItems="center">
                      <Switch 
                        id="email-notifications" 
                        colorScheme="brand" 
                        mr={3}
                        {...registerSettings('emailNotifications')}
                      />
                      <FormLabel htmlFor="email-notifications" mb={0}>
                        {t('settings.emailNotifications')}
                      </FormLabel>
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <Switch 
                        id="push-notifications" 
                        colorScheme="brand" 
                        mr={3}
                        {...registerSettings('pushNotifications')}
                      />
                      <FormLabel htmlFor="push-notifications" mb={0}>
                        {t('settings.pushNotifications')}
                      </FormLabel>
                    </FormControl>
                    
                    <Divider />
                    
                    <Heading size="md">{t('settings.tasks')}</Heading>
                    
                    <FormControl>
                      <FormLabel>{t('settings.defaultView')}</FormLabel>
                      <Select {...registerSettings('defaultView')}>
                        <option value="board">{t('tasks.boardView')}</option>
                        <option value="list">{t('tasks.listView')}</option>
                        <option value="calendar">{t('tasks.calendarView')}</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <Switch 
                        id="show-completed" 
                        colorScheme="brand" 
                        mr={3}
                        {...registerSettings('showCompletedTasks')}
                      />
                      <FormLabel htmlFor="show-completed" mb={0}>
                        {t('settings.showCompletedTasks')}
                      </FormLabel>
                    </FormControl>
                    
                    <Button 
                      type="submit" 
                      colorScheme="brand" 
                      alignSelf="flex-start"
                      isLoading={loading}
                    >
                      {t('common.save')}
                    </Button>
                  </VStack>
                </form>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default ProfilePage; 