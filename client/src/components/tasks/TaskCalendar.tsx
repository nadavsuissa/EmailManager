import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  Box,
  Text,
  Flex,
  Grid,
  Badge,
  VStack,
  HStack,
  Heading,
  IconButton,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { updateTask } from '../../store/slices/tasksSlice';
import { formatHebrewDate, isToday, isSameDay } from '../../utils/dateUtils';
import { AppDispatch } from '../../store/store';

interface TaskCalendarProps {
  tasks: Task[];
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Get current date info
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  // Colors
  const dayBgColor = useColorModeValue('white', 'gray.700');
  const currentDayBgColor = useColorModeValue('blue.50', 'blue.900');
  const dayBorderColor = useColorModeValue('gray.200', 'gray.600');
  const taskBgColor = useColorModeValue('gray.50', 'gray.600');
  
  // Helper functions for calendar management
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };
  
  // Navigate to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Generate array of calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Days array starts with empty slots for days before the 1st of the month
    const days = [];
    
    // Add placeholder days from previous month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({ day: i, date });
    }
    
    return days;
  };
  
  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };
  
  // Get color for task status
  const getStatusColor = (status: TaskStatus): string => {
    const colors: Record<TaskStatus, string> = {
      pending: 'yellow',
      'in-progress': 'blue',
      completed: 'green',
    };
    return colors[status] || 'gray';
  };
  
  // Get color for task priority
  const getPriorityColor = (priority: TaskPriority): string => {
    const colors: Record<TaskPriority, string> = {
      high: 'red',
      medium: 'orange',
      low: 'green',
    };
    return colors[priority] || 'gray';
  };
  
  // Toggle task status
  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    dispatch(updateTask({
      id: task.id,
      task: { ...task, status: newStatus },
    }));
  };
  
  // Edit task
  const handleEditTask = (taskId: string) => {
    navigate(`/tasks/${taskId}/edit`);
  };
  
  // Render individual day cell
  const renderDayCell = ({ day, date }: { day: number | null, date: Date | null }) => {
    if (!day || !date) {
      return <Box bg={dayBgColor} borderWidth="1px" borderColor={dayBorderColor} />;
    }
    
    const isCurrentDay = isToday(date);
    const tasksForDay = getTasksForDate(date);
    const formattedHebrewDate = formatHebrewDate(date);
    
    return (
      <Box
        bg={isCurrentDay ? currentDayBgColor : dayBgColor}
        borderWidth="1px"
        borderColor={dayBorderColor}
        position="relative"
        minHeight="100px"
        p={1}
        overflow="auto"
      >
        <Flex justify="space-between" align="center" mb={1}>
          <Text 
            fontWeight={isCurrentDay ? 'bold' : 'normal'}
            color={isCurrentDay ? 'blue.500' : undefined}
          >
            {day}
          </Text>
          <Tooltip label={formattedHebrewDate} placement="top">
            <Text fontSize="xs" color="gray.500">
              {formattedHebrewDate.split(' ')[0]}
            </Text>
          </Tooltip>
        </Flex>
        
        <VStack spacing={1} align="stretch">
          {tasksForDay.map(task => (
            <Popover key={task.id} trigger="hover" placement="right">
              <PopoverTrigger>
                <Box
                  bg={taskBgColor}
                  p={1}
                  borderRadius="sm"
                  borderLeftWidth="3px"
                  borderLeftColor={getPriorityColor(task.priority) + ".400"}
                  mb={1}
                  cursor="pointer"
                  onClick={() => handleEditTask(task.id)}
                  _hover={{ bg: taskBgColor === 'gray.50' ? 'gray.100' : 'gray.700' }}
                  opacity={task.status === 'completed' ? 0.6 : 1}
                >
                  <Flex justify="space-between" align="center">
                    <Text 
                      fontSize="xs" 
                      fontWeight="medium" 
                      noOfLines={1}
                      textDecoration={task.status === 'completed' ? 'line-through' : 'none'}
                    >
                      {task.title}
                    </Text>
                    <Badge size="sm" colorScheme={getStatusColor(task.status)} variant="solid" ml={1}>
                      {/* Status indicator, no text for space saving */}
                    </Badge>
                  </Flex>
                </Box>
              </PopoverTrigger>
              <PopoverContent width="300px">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="bold">{task.title}</PopoverHeader>
                <PopoverBody>
                  <VStack align="stretch" spacing={2}>
                    {task.description && (
                      <Text fontSize="sm">{task.description}</Text>
                    )}
                    <HStack>
                      <Badge colorScheme={getPriorityColor(task.priority)}>
                        {t(`tasks.priority.${task.priority}`)}
                      </Badge>
                      <Badge colorScheme={getStatusColor(task.status)}>
                        {t(`tasks.status.${task.status}`)}
                      </Badge>
                    </HStack>
                    <Flex justify="space-between" pt={2}>
                      <IconButton
                        aria-label={t('common.edit')}
                        icon={<FiEdit2 />}
                        size="sm"
                        onClick={() => handleEditTask(task.id)}
                      />
                      <IconButton
                        aria-label={task.status === 'completed' ? t('tasks.actions.markIncomplete') : t('tasks.actions.markComplete')}
                        icon={task.status === 'completed' ? <FiXCircle /> : <FiCheckCircle />}
                        size="sm"
                        onClick={() => handleToggleStatus(task)}
                      />
                    </Flex>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          ))}
        </VStack>
      </Box>
    );
  };
  
  // Get calendar days
  const calendarDays = generateCalendarDays();
  
  // Hebrew day names (based on Sunday-first calendar)
  const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  // English day names
  const englishDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Use appropriate day names based on language
  const dayNames = i18n.language === 'he' ? hebrewDayNames : englishDayNames;
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Hebrew month names
  const hebrewMonthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  
  const monthName = i18n.language === 'he' ? hebrewMonthNames[currentMonth] : monthNames[currentMonth];
  
  return (
    <Box>
      {/* Calendar Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <IconButton
          aria-label={t('calendar.previous')}
          icon={<FiChevronLeft />}
          onClick={handlePrevMonth}
          variant="ghost"
        />
        
        <Heading size="md">
          {monthName} {currentYear}
        </Heading>
        
        <IconButton
          aria-label={t('calendar.next')}
          icon={<FiChevronRight />}
          onClick={handleNextMonth}
          variant="ghost"
        />
      </Flex>
      
      {/* Calendar Day Names */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={1}>
        {dayNames.map((day, index) => (
          <Box 
            key={index}
            p={2}
            textAlign="center"
            fontWeight="bold"
            bg={useColorModeValue('gray.50', 'gray.700')}
            color={index === 5 || index === 6 ? 'red.400' : undefined} // Color for Friday/Saturday (weekend)
          >
            <Text fontSize="sm">{day}</Text>
          </Box>
        ))}
      </Grid>
      
      {/* Calendar Grid */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1} height="calc(100vh - 400px)">
        {calendarDays.map((dayObj, index) => (
          <Box key={index} height="auto">
            {renderDayCell(dayObj)}
          </Box>
        ))}
      </Grid>
    </Box>
  );
}; 