import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Flex,
  Image,
  Text,
  VStack,
  HStack,
  Select,
  useColorMode,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useDispatch } from 'react-redux';

import { setLanguage } from '../store/slices/uiSlice';
import { useDirection } from '../context/DirectionContext';

// Logo placeholder - replace with actual logo import
const logoPlaceholder = "https://via.placeholder.com/150x50?text=Logo";

const AuthLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colorMode, toggleColorMode } = useColorMode();
  const dispatch = useDispatch();
  const { direction } = useDirection();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value as 'he' | 'en';
    i18n.changeLanguage(newLang);
    dispatch(setLanguage(newLang));
  };
  
  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={4}>
        <Flex justifyContent="space-between" alignItems="center" mb={10}>
          <Image 
            src={logoPlaceholder} 
            alt={t('app.name')}
            h="50px"
          />
          <HStack spacing={4}>
            <Select 
              value={i18n.language} 
              onChange={handleLanguageChange}
              size="sm"
              w="120px"
              dir={direction}
            >
              <option value="he">עברית</option>
              <option value="en">English</option>
            </Select>
            <IconButton
              aria-label={t('settings.theme')}
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
            />
          </HStack>
        </Flex>
        
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          minH="70vh" 
          align="center" 
          justify="center"
          gap={{ base: 8, md: 16 }}
        >
          <VStack 
            flex={{ base: '1', md: '1' }} 
            align={{ base: 'center', md: direction === 'rtl' ? 'flex-end' : 'flex-start' }} 
            spacing={6}
            textAlign={{ base: 'center', md: direction === 'rtl' ? 'right' : 'left' }}
            p={4}
          >
            <Text 
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }} 
              fontWeight="bold"
              lineHeight="shorter"
              color="brand.500"
            >
              {t('app.name')}
            </Text>
            <Text 
              fontSize={{ base: 'xl', md: '2xl' }} 
              fontWeight="medium"
              opacity={0.8}
              maxW="500px"
            >
              {t('app.tagline')}
            </Text>
            <Text 
              fontSize="md" 
              opacity={0.6}
              maxW="500px"
            >
              {t('auth.loginRequired')}
            </Text>
          </VStack>
          
          <Box 
            flex={{ base: '1', md: '1' }} 
            bg={cardBg} 
            p={{ base: 6, md: 8 }} 
            borderRadius="xl" 
            boxShadow="xl"
            w={{ base: "90%", sm: "450px" }}
          >
            <Outlet />
          </Box>
        </Flex>
      </Container>
      
      <Box as="footer" textAlign="center" py={6}>
        <Text color="gray.500" fontSize="sm">
          {t('app.footer')}
        </Text>
      </Box>
    </Box>
  );
};

export default AuthLayout; 