import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  Box,
  SimpleGrid,
  Text,
  Heading,
  Badge,
  VStack,
  HStack,
  Flex,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiEdit2, 
  FiTrash2, 
  FiMoreVertical, 
  FiCheckCircle, 
  FiClock,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
} from 'react-icons/fi';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { updateTask, deleteTask } from '../../store/slices/tasksSlice';
import { formatRelativeDate } from '../../utils/dateUtils';
import { AppDispatch } from '../../store/store';

interface TaskBoardProps {
  tasks: Task[];
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const columnBg = useColorModeValue('gray.50', 'gray.800');
  
  // Group tasks by status
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    'pending': [],
    'in-progress': [],
    'completed': [],
  };
  
  tasks.forEach(task => {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    } else {
      tasksByStatus['pending'].push(task);
    }
  });
  
  // Handle task status change
  const handleChangeStatus = (task: Task, newStatus: TaskStatus) => {
    dispatch(updateTask({
      id: task.id,
      task: { ...task, status: newStatus },
    }));
  };
  
  // Edit task
  const handleEditTask = (taskId: string) => {
    navigate(`/tasks/${taskId}/edit`);
  };
  
  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm(t('tasks.confirmDelete'))) {
      dispatch(deleteTask(taskId));
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: TaskPriority): string => {
    const colors: Record<TaskPriority, string> = {
      high: 'red',
      medium: 'orange',
      low: 'green',
    };
    return colors[priority] || 'gray';
  };
  
  // Render a task card
  const renderTaskCard = (task: Task) => {
    const canMoveBack = task.status !== 'pending';
    const canMoveForward = task.status !== 'completed';
    
    return (
      <Box
        key={task.id}
        p={3}
        mb={3}
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        boxShadow="sm"
        _hover={{ boxShadow: 'md' }}
      >
        <VStack align="stretch" spacing={2}>
          <Flex justify="space-between" align="center">
            <Badge colorScheme={getPriorityColor(task.priority)} px={2} py={1} borderRadius="full">
              {t(`tasks.priority.${task.priority}`)}
            </Badge>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                aria-label={t('common.actions')}
              />
              <MenuList>
                <MenuItem 
                  icon={<FiEdit2 />} 
                  onClick={() => handleEditTask(task.id)}
                >
                  {t('common.edit')}
                </MenuItem>
                <MenuItem 
                  icon={<FiCheckCircle />} 
                  onClick={() => handleChangeStatus(task, 'completed')}
                  isDisabled={task.status === 'completed'}
                >
                  {t('tasks.actions.markComplete')}
                </MenuItem>
                <MenuItem 
                  icon={<FiTrash2 />} 
                  onClick={() => handleDeleteTask(task.id)}
                  color="red.500"
                >
                  {t('common.delete')}
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
          
          <Heading size="sm" cursor="pointer" onClick={() => handleEditTask(task.id)}>
            {task.title}
          </Heading>
          
          {task.description && (
            <Text noOfLines={2} fontSize="sm" color="gray.500">
              {task.description}
            </Text>
          )}
          
          <HStack spacing={4} mt={1}>
            {task.dueDate && (
              <Flex align="center" fontSize="sm">
                <FiClock style={{ marginRight: '4px' }} />
                <Text>{formatRelativeDate(task.dueDate)}</Text>
              </Flex>
            )}
            
            {task.assignedTo && (
              <Flex align="center">
                <Avatar 
                  size="xs" 
                  name={task.assignedTo.name} 
                  src={task.assignedTo.photoURL}
                  mr={1}
                />
                <Text fontSize="sm">{task.assignedTo.name}</Text>
              </Flex>
            )}
          </HStack>
          
          {/* Task movement buttons */}
          <Flex justify="space-between" pt={2}>
            <IconButton
              aria-label={t('tasks.actions.moveBack')}
              icon={<FiArrowLeft />}
              size="sm"
              variant="ghost"
              isDisabled={!canMoveBack}
              onClick={() => {
                const newStatus: TaskStatus = task.status === 'completed' ? 'in-progress' : 'pending';
                handleChangeStatus(task, newStatus);
              }}
            />
            <IconButton
              aria-label={t('tasks.actions.moveForward')}
              icon={<FiArrowRight />}
              size="sm"
              variant="ghost"
              isDisabled={!canMoveForward}
              onClick={() => {
                const newStatus: TaskStatus = task.status === 'pending' ? 'in-progress' : 'completed';
                handleChangeStatus(task, newStatus);
              }}
            />
          </Flex>
        </VStack>
      </Box>
    );
  };
  
  return (
    <SimpleGrid columns={3} spacing={4} height="calc(100vh - 300px)" overflowY="hidden">
      {/* Pending Column */}
      <Box bg={columnBg} p={3} borderRadius="md" height="100%" overflowY="auto">
        <Heading size="md" mb={4}>
          {t('tasks.status.pending')}
          <Badge ml={2} colorScheme="yellow" borderRadius="full">
            {tasksByStatus['pending'].length}
          </Badge>
        </Heading>
        {tasksByStatus['pending'].length === 0 ? (
          <Text color="gray.500" textAlign="center" py={4}>
            {t('tasks.noTasksInStatus')}
          </Text>
        ) : (
          tasksByStatus['pending'].map(renderTaskCard)
        )}
      </Box>
      
      {/* In Progress Column */}
      <Box bg={columnBg} p={3} borderRadius="md" height="100%" overflowY="auto">
        <Heading size="md" mb={4}>
          {t('tasks.status.inProgress')}
          <Badge ml={2} colorScheme="blue" borderRadius="full">
            {tasksByStatus['in-progress'].length}
          </Badge>
        </Heading>
        {tasksByStatus['in-progress'].length === 0 ? (
          <Text color="gray.500" textAlign="center" py={4}>
            {t('tasks.noTasksInStatus')}
          </Text>
        ) : (
          tasksByStatus['in-progress'].map(renderTaskCard)
        )}
      </Box>
      
      {/* Completed Column */}
      <Box bg={columnBg} p={3} borderRadius="md" height="100%" overflowY="auto">
        <Heading size="md" mb={4}>
          {t('tasks.status.completed')}
          <Badge ml={2} colorScheme="green" borderRadius="full">
            {tasksByStatus['completed'].length}
          </Badge>
        </Heading>
        {tasksByStatus['completed'].length === 0 ? (
          <Text color="gray.500" textAlign="center" py={4}>
            {t('tasks.noTasksInStatus')}
          </Text>
        ) : (
          tasksByStatus['completed'].map(renderTaskCard)
        )}
      </Box>
    </SimpleGrid>
  );
}; 