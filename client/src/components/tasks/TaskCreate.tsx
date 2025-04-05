import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  Textarea,
  Select,
  VStack,
  HStack,
  Box,
  Divider,
  useColorModeValue,
  Flex,
  Text,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { createTask, updateTask, selectLoading } from '../../store/slices/tasksSlice';
import { AppDispatch } from '../../store/store';

interface TaskCreateProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task; // If provided, we're editing. If not, we're creating.
}

export const TaskCreate: React.FC<TaskCreateProps> = ({ isOpen, onClose, task }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectLoading);
  const toast = useToast();
  
  // Form setup with react-hook-form
  const { 
    handleSubmit, 
    register, 
    reset, 
    formState: { errors },
    setValue,
  } = useForm<Partial<Task>>({
    defaultValues: task || {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
    },
  });
  
  // Reset form when task changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(task || {
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
      });
    }
  }, [isOpen, task, reset]);
  
  // Form submission handler
  const onSubmit = async (data: Partial<Task>) => {
    try {
      if (task) {
        // Update existing task
        await dispatch(updateTask({ 
          id: task.id, 
          task: data 
        }));
        toast({
          title: t('tasks.updated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new task
        await dispatch(createTask(data));
        toast({
          title: t('tasks.created'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tasks.saveFailed'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Form colors
  const formBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {task ? t('tasks.edit') : t('tasks.create')}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <form id="task-form" onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4} align="stretch">
              {/* Task Title */}
              <FormControl isInvalid={!!errors.title} isRequired>
                <FormLabel>{t('tasks.titleField')}</FormLabel>
                <Input
                  {...register('title', { 
                    required: t('tasks.validation.titleRequired') as string 
                  })}
                  placeholder={t('tasks.placeholders.title')}
                  autoFocus
                />
                <FormErrorMessage>
                  {errors.title && errors.title.message}
                </FormErrorMessage>
              </FormControl>
              
              {/* Task Description */}
              <FormControl>
                <FormLabel>{t('tasks.descriptionField')}</FormLabel>
                <Textarea
                  {...register('description')}
                  placeholder={t('tasks.placeholders.description')}
                  rows={4}
                />
              </FormControl>
              
              <Divider />
              
              {/* Task Priority */}
              <FormControl isRequired>
                <FormLabel>{t('tasks.priorityField')}</FormLabel>
                <Select {...register('priority')}>
                  <option value="low">{t('tasks.priority.low')}</option>
                  <option value="medium">{t('tasks.priority.medium')}</option>
                  <option value="high">{t('tasks.priority.high')}</option>
                </Select>
              </FormControl>
              
              {/* Task Status */}
              <FormControl isRequired>
                <FormLabel>{t('tasks.statusField')}</FormLabel>
                <Select {...register('status')}>
                  <option value="pending">{t('tasks.status.pending')}</option>
                  <option value="in-progress">{t('tasks.status.inProgress')}</option>
                  <option value="completed">{t('tasks.status.completed')}</option>
                </Select>
              </FormControl>
              
              {/* Due Date */}
              <FormControl>
                <FormLabel>{t('tasks.dueDateField')}</FormLabel>
                <Input
                  {...register('dueDate')}
                  type="date"
                  max="2100-12-31"
                />
              </FormControl>
              
              {/* Team Assignment (if team feature is enabled) */}
              <FormControl>
                <FormLabel>{t('tasks.teamField')}</FormLabel>
                <Select
                  {...register('teamId')}
                  placeholder={t('tasks.placeholders.selectTeam')}
                >
                  <option value="team1">Team 1</option>
                  <option value="team2">Team 2</option>
                  {/* Teams would be populated from the API */}
                </Select>
              </FormControl>
              
              {/* User Assignment */}
              <FormControl>
                <FormLabel>{t('tasks.assignedToField')}</FormLabel>
                <Select
                  {...register('assignedTo')}
                  placeholder={t('tasks.placeholders.selectUser')}
                >
                  <option value="user1">User 1</option>
                  <option value="user2">User 2</option>
                  {/* Users would be populated from the API */}
                </Select>
              </FormControl>
              
              {/* Labels/Tags would be added here if implementing that feature */}
            </VStack>
          </form>
        </ModalBody>
        
        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          <Button 
            variant="outline" 
            mr={3} 
            onClick={onClose}
            isDisabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            colorScheme="blue" 
            type="submit"
            form="task-form"
            isLoading={loading}
            loadingText={t('common.saving')}
          >
            {task ? t('common.save') : t('common.create')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 