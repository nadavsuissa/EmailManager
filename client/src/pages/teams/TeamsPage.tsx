import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Flex,
  Badge,
  Avatar,
  AvatarGroup,
  Icon,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiUsers, FiUserPlus, FiSettings, FiTrash2, FiStar } from 'react-icons/fi';
import { useForm } from 'react-hook-form';

// Team service to be implemented
import { getTeams, createTeam } from '../../services/teamService';

// Team type to be defined in types
interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  ownerId: string;
  userRole: 'owner' | 'admin' | 'member' | 'guest';
  members?: {
    id: string;
    displayName: string;
    photoURL?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface TeamFormData {
  name: string;
  description?: string;
}

const TeamsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>();
  
  useEffect(() => {
    fetchTeams();
  }, []);
  
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await getTeams();
      setTeams(response);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.somethingWentWrong');
      setError(errorMessage);
      
      toast({
        title: t('errors.somethingWentWrong'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data: TeamFormData) => {
    try {
      const newTeam = await createTeam(data);
      
      // Update the teams list
      setTeams((prevTeams) => [newTeam, ...prevTeams]);
      
      // Show success toast
      toast({
        title: t('teams.teamCreated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Close the modal and reset the form
      onClose();
      reset();
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
  
  const handleTeamClick = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'purple';
      case 'admin':
        return 'green';
      case 'member':
        return 'blue';
      case 'guest':
        return 'gray';
      default:
        return 'gray';
    }
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={4}
        >
          <Box>
            <Heading size="lg">{t('teams.title')}</Heading>
            <Text color="gray.500">{t('teams.title')}</Text>
          </Box>
          
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="brand" 
            onClick={onOpen}
          >
            {t('teams.createTeam')}
          </Button>
        </Flex>
        
        {loading ? (
          <Center py={10}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : error ? (
          <Center py={10}>
            <Text color="red.500">{error}</Text>
          </Center>
        ) : teams.length === 0 ? (
          <Center 
            py={10} 
            bg={cardBg} 
            borderWidth="1px" 
            borderColor={borderColor} 
            borderRadius="lg"
            flexDirection="column"
            gap={4}
          >
            <Icon as={FiUsers} boxSize={12} color="gray.400" />
            <VStack spacing={1}>
              <Text fontSize="xl" fontWeight="medium">{t('teams.noTeams')}</Text>
              <Text color="gray.500">{t('teams.createTeam')}</Text>
            </VStack>
            <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>
              {t('teams.createTeam')}
            </Button>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {teams.map((team) => (
              <Box
                key={team.id}
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                overflow="hidden"
                boxShadow="sm"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                onClick={() => handleTeamClick(team.id)}
                cursor="pointer"
              >
                <Box p={6}>
                  <Flex justify="space-between" align="flex-start" mb={2}>
                    <Heading size="md" isTruncated>
                      {team.name}
                    </Heading>
                    <Badge colorScheme={getRoleBadgeColor(team.userRole)}>
                      {t(`teams.${team.userRole}`)}
                    </Badge>
                  </Flex>
                  
                  {team.description && (
                    <Text color="gray.500" noOfLines={2} mb={4}>
                      {team.description}
                    </Text>
                  )}
                  
                  <HStack justify="space-between">
                    <HStack>
                      {team.members && team.members.length > 0 ? (
                        <AvatarGroup size="sm" max={3}>
                          {team.members.map((member) => (
                            <Avatar
                              key={member.id}
                              name={member.displayName}
                              src={member.photoURL}
                            />
                          ))}
                        </AvatarGroup>
                      ) : (
                        <Avatar size="sm" icon={<FiUsers />} />
                      )}
                      <Text fontSize="sm">
                        {team.memberCount} {t('teams.members')}
                      </Text>
                    </HStack>
                    
                    {team.userRole === 'owner' && (
                      <Icon as={FiStar} color="yellow.500" />
                    )}
                  </HStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>
      
      {/* Create Team Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>{t('teams.createTeam')}</ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>{t('teams.name')}</FormLabel>
                  <Input
                    {...register('name', {
                      required: t('errors.required'),
                      minLength: {
                        value: 2,
                        message: t('errors.required'),
                      },
                    })}
                  />
                  <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('teams.description')}</FormLabel>
                  <Textarea {...register('description')} />
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                colorScheme="brand" 
                isLoading={isSubmitting}
              >
                {t('common.create')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default TeamsPage; 