import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Checkbox,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Flex,
  HStack,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiEdit2, 
  FiTrash2, 
  FiMoreVertical, 
  FiCheckCircle, 
  FiXCircle,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import { Task, TaskPriority } from '../../types/task';
import { updateTask, deleteTask } from '../../store/slices/tasksSlice';
import { formatRelativeDate } from '../../utils/dateUtils';
import { AppDispatch } from '../../store/store';

interface TaskListProps {
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // State for sorting
  const [sortField, setSortField] = useState<keyof Task>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Colors
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Priority colors
  const priorityColors = {
    high: 'red',
    medium: 'orange',
    low: 'green',
  };
  
  // Status colors
  const statusColors = {
    pending: 'yellow',
    'in-progress': 'blue',
    completed: 'green',
  };
  
  // Handle sorting
  const handleSort = (field: keyof Task) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Toggle task status (complete/incomplete)
  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    dispatch(
      updateTask({
        id: task.id,
        task: { ...task, status: newStatus },
      })
    );
  };
  
  // Edit task
  const handleEditTask = (taskId: string) => {
    // Navigate to edit page or open edit modal
    navigate(`/tasks/${taskId}/edit`);
  };
  
  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm(t('tasks.confirmDelete'))) {
      dispatch(deleteTask(taskId));
    }
  };
  
  // Sort tasks based on field and direction
  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    // Handle dates
    if (sortField === 'dueDate') {
      aValue = aValue ? new Date(aValue).getTime() : Infinity;
      bValue = bValue ? new Date(bValue).getTime() : Infinity;
    }
    
    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue, 'he')
        : bValue.localeCompare(aValue, 'he');
    }
    
    // Handle numbers and other types
    return sortDirection === 'asc'
      ? (aValue > bValue ? 1 : -1)
      : (aValue < bValue ? 1 : -1);
  });
  
  return (
    <Box overflowX="auto">
      {tasks.length === 0 ? (
        <Text textAlign="center" p={4}>
          {t('tasks.noTasksAvailable')}
        </Text>
      ) : (
        <Table variant="simple" size="md">
          <Thead bg={tableHeaderBg}>
            <Tr>
              <Th width="40px"></Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('title')}
              >
                <Flex align="center">
                  {t('tasks.title')}
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                  )}
                </Flex>
              </Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('priority')}
              >
                <Flex align="center">
                  {t('tasks.priority')}
                  {sortField === 'priority' && (
                    sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                  )}
                </Flex>
              </Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('status')}
              >
                <Flex align="center">
                  {t('tasks.status')}
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                  )}
                </Flex>
              </Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('dueDate')}
              >
                <Flex align="center">
                  {t('tasks.dueDate')}
                  {sortField === 'dueDate' && (
                    sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                  )}
                </Flex>
              </Th>
              <Th>{t('tasks.assignedTo')}</Th>
              <Th width="80px">{t('common.actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedTasks.map((task) => (
              <Tr key={task.id} _hover={{ bg: hoverBg }}>
                <Td>
                  <Checkbox 
                    isChecked={task.status === 'completed'} 
                    onChange={() => handleToggleStatus(task)}
                    colorScheme="green"
                  />
                </Td>
                <Td>
                  <Link 
                    fontWeight="medium" 
                    onClick={() => handleEditTask(task.id)}
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <Text noOfLines={1} fontSize="sm" color="gray.500">
                      {task.description}
                    </Text>
                  )}
                </Td>
                <Td>
                  <Badge colorScheme={priorityColors[task.priority as TaskPriority]}>
                    {t(`tasks.priority.${task.priority}`)}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={statusColors[task.status]}>
                    {t(`tasks.status.${task.status}`)}
                  </Badge>
                </Td>
                <Td>
                  {task.dueDate ? (
                    <Text>
                      {formatRelativeDate(task.dueDate)}
                    </Text>
                  ) : (
                    <Text color="gray.500">{t('tasks.noDueDate')}</Text>
                  )}
                </Td>
                <Td>
                  {task.assignedTo ? (
                    <HStack>
                      <Avatar 
                        size="xs" 
                        name={task.assignedTo.name} 
                        src={task.assignedTo.photoURL} 
                      />
                      <Text>{task.assignedTo.name}</Text>
                    </HStack>
                  ) : (
                    <Text color="gray.500">{t('tasks.unassigned')}</Text>
                  )}
                </Td>
                <Td>
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
                        icon={task.status === 'completed' ? <FiXCircle /> : <FiCheckCircle />}
                        onClick={() => handleToggleStatus(task)}
                      >
                        {task.status === 'completed' ? 
                          t('tasks.actions.markIncomplete') : 
                          t('tasks.actions.markComplete')
                        }
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
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}; 