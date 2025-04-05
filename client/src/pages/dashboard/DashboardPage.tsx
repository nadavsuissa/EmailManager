import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Badge,
  useColorModeValue,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter, FiCalendar, FiGrid, FiList } from 'react-icons/fi';
import { fetchTasks, selectFilteredTasks, selectLoading, selectError, selectView, setView, setFilterStatus, setFilterPriority, setSearchTerm } from '../../store/slices/tasksSlice';
import { TaskList } from '../../components/tasks/TaskList';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import { TaskCalendar } from '../../components/tasks/TaskCalendar';
import { TaskCreate } from '../../components/tasks/TaskCreate';
import { useAuth } from '../../hooks/useAuth';
import { AppDispatch } from '../../store/store';

// Mock data for stats
const mockStats = {
  totalTasks: 42,
  completedTasks: 18,
  inProgressTasks: 15,
  pendingTasks: 9,
  overdueTasks: 3,
  upcomingDeadlines: 5,
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector(selectFilteredTasks);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const view = useSelector(selectView);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [searchValue, setSearchValue] = useState('');
  
  // Fetch tasks on component mount
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);
  
  // Handle search input with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    const timeoutId = setTimeout(() => {
      dispatch(setSearchTerm(e.target.value));
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Handle status filter change
  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilterStatus(e.target.value as any));
  };
  
  // Handle priority filter change
  const handlePriorityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilterPriority(e.target.value as any));
  };
  
  // Change view (list, board, calendar)
  const handleViewChange = (newView: 'list' | 'board' | 'calendar') => {
    dispatch(setView(newView));
  };
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const statBgColor = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Container maxW="container.xl" py={6}>
      {/* Header section with greeting */}
      <Flex direction="row" justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            {t('dashboard.greeting', { name: user?.displayName || t('common.user') })}
          </Heading>
          <Text color="gray.500">
            {t('dashboard.subtitle')}
          </Text>
        </Box>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue" 
          onClick={onOpen}
        >
          {t('tasks.create')}
        </Button>
      </Flex>
      
      {/* Stats section */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={8}>
        <Stat bg={statBgColor} p={4} borderRadius="md" textAlign="center">
          <StatLabel>{t('dashboard.stats.total')}</StatLabel>
          <StatNumber>{mockStats.totalTasks}</StatNumber>
          <StatHelpText>{t('dashboard.stats.allTasks')}</StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={4} borderRadius="md" textAlign="center">
          <StatLabel>{t('dashboard.stats.completed')}</StatLabel>
          <StatNumber color="green.500">{mockStats.completedTasks}</StatNumber>
          <StatHelpText>
            {t('dashboard.stats.completionRate', { 
              rate: Math.round((mockStats.completedTasks / mockStats.totalTasks) * 100) 
            })}%
          </StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={4} borderRadius="md" textAlign="center">
          <StatLabel>{t('dashboard.stats.inProgress')}</StatLabel>
          <StatNumber color="blue.500">{mockStats.inProgressTasks}</StatNumber>
          <StatHelpText>
            {t('dashboard.stats.activeRate', { 
              rate: Math.round((mockStats.inProgressTasks / mockStats.totalTasks) * 100) 
            })}%
          </StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={4} borderRadius="md" textAlign="center">
          <StatLabel>{t('dashboard.stats.pending')}</StatLabel>
          <StatNumber color="orange.500">{mockStats.pendingTasks}</StatNumber>
          <StatHelpText>
            {t('dashboard.stats.pendingRate', { 
              rate: Math.round((mockStats.pendingTasks / mockStats.totalTasks) * 100) 
            })}%
          </StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={4} borderRadius="md" textAlign="center">
          <StatLabel>{t('dashboard.stats.overdue')}</StatLabel>
          <StatNumber color="red.500">{mockStats.overdueTasks}</StatNumber>
          <StatHelpText>{t('dashboard.stats.needAttention')}</StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={4} borderRadius="md" textAlign="center">
          <StatLabel>{t('dashboard.stats.upcoming')}</StatLabel>
          <StatNumber color="purple.500">{mockStats.upcomingDeadlines}</StatNumber>
          <StatHelpText>{t('dashboard.stats.nextDays')}</StatHelpText>
        </Stat>
      </SimpleGrid>
      
      {/* Task management section */}
      <Box bg={bgColor} p={5} borderRadius="lg" shadow="md">
        <Flex 
          mb={4} 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
        >
          <Heading size="md">{t('tasks.management')}</Heading>
          
          {/* Search and filters */}
          <HStack spacing={4} flex="1" justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
            <InputGroup maxW={{ base: '100%', md: '220px' }}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input 
                placeholder={t('common.search')} 
                value={searchValue}
                onChange={handleSearch}
              />
            </InputGroup>
            
            <Select 
              maxW={{ base: '100%', md: '150px' }} 
              placeholder={t('tasks.filter.status')}
              onChange={handleStatusFilter}
            >
              <option value="all">{t('tasks.filter.allStatuses')}</option>
              <option value="pending">{t('tasks.status.pending')}</option>
              <option value="in-progress">{t('tasks.status.inProgress')}</option>
              <option value="completed">{t('tasks.status.completed')}</option>
            </Select>
            
            <Select 
              maxW={{ base: '100%', md: '150px' }} 
              placeholder={t('tasks.filter.priority')}
              onChange={handlePriorityFilter}
            >
              <option value="all">{t('tasks.filter.allPriorities')}</option>
              <option value="low">{t('tasks.priority.low')}</option>
              <option value="medium">{t('tasks.priority.medium')}</option>
              <option value="high">{t('tasks.priority.high')}</option>
            </Select>
          </HStack>
        </Flex>
        
        {/* View toggle */}
        <Flex mb={4} justifyContent="flex-end">
          <HStack spacing={2}>
            <IconButton
              aria-label={t('tasks.view.list')}
              icon={<FiList />}
              size="sm"
              colorScheme={view === 'list' ? 'blue' : 'gray'}
              variant={view === 'list' ? 'solid' : 'outline'}
              onClick={() => handleViewChange('list')}
            />
            <IconButton
              aria-label={t('tasks.view.board')}
              icon={<FiGrid />}
              size="sm"
              colorScheme={view === 'board' ? 'blue' : 'gray'}
              variant={view === 'board' ? 'solid' : 'outline'}
              onClick={() => handleViewChange('board')}
            />
            <IconButton
              aria-label={t('tasks.view.calendar')}
              icon={<FiCalendar />}
              size="sm"
              colorScheme={view === 'calendar' ? 'blue' : 'gray'}
              variant={view === 'calendar' ? 'solid' : 'outline'}
              onClick={() => handleViewChange('calendar')}
            />
          </HStack>
        </Flex>
        
        {/* Error message */}
        {error && (
          <Box mb={4} p={3} bg="red.50" color="red.500" borderRadius="md">
            {error}
          </Box>
        )}
        
        {/* Task views */}
        {loading ? (
          <Box textAlign="center" py={10}>
            <Text>{t('common.loading')}</Text>
          </Box>
        ) : tasks.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text>{t('tasks.noTasks')}</Text>
            <Button mt={4} colorScheme="blue" onClick={onOpen}>
              {t('tasks.createFirst')}
            </Button>
          </Box>
        ) : (
          <>
            {view === 'list' && <TaskList tasks={tasks} />}
            {view === 'board' && <TaskBoard tasks={tasks} />}
            {view === 'calendar' && <TaskCalendar tasks={tasks} />}
          </>
        )}
      </Box>
      
      {/* Task create/edit modal */}
      <TaskCreate isOpen={isOpen} onClose={onClose} />
    </Container>
  );
};

export default DashboardPage; 