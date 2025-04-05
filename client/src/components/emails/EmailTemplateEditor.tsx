import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Box,
  Flex,
  Button,
  Text,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Select,
  Divider,
  useColorModeValue,
  useToast,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiBold,
  FiItalic,
  FiList,
  FiLink,
  FiImage,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiCode,
  FiClock,
  FiTag,
  FiSave,
  FiMoreVertical,
  FiCopy,
} from 'react-icons/fi';
import { api } from '../../services/api';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  language: 'he' | 'en' | 'both';
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

interface Variable {
  key: string;
  description: string;
  example: string;
}

interface EmailTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  template?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
}

// Available variables to use in templates
const AVAILABLE_VARIABLES: Variable[] = [
  { key: '{{recipient.name}}', description: 'שם המקבל', example: 'ישראל ישראלי' },
  { key: '{{recipient.email}}', description: 'כתובת המייל של המקבל', example: 'israel@example.com' },
  { key: '{{sender.name}}', description: 'שם השולח', example: 'יעל כהן' },
  { key: '{{sender.email}}', description: 'כתובת המייל של השולח', example: 'yael@company.com' },
  { key: '{{company.name}}', description: 'שם החברה', example: 'חברת אלפא' },
  { key: '{{meeting.date}}', description: 'תאריך הפגישה', example: '15 במרץ 2023' },
  { key: '{{meeting.time}}', description: 'שעת הפגישה', example: '14:30' },
  { key: '{{task.name}}', description: 'שם המשימה', example: 'כתיבת הצעת מחיר' },
  { key: '{{task.deadline}}', description: 'תאריך יעד למשימה', example: '30 במרץ 2023' },
];

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<Partial<EmailTemplate>>({
    defaultValues: template || {
      name: '',
      subject: '',
      content: '',
      language: 'he',
      tags: [],
    },
  });
  
  const currentContent = watch('content');
  const currentSubject = watch('subject');
  const currentLanguage = watch('language');
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textareaColor = useColorModeValue('gray.700', 'gray.200');
  const previewBgColor = useColorModeValue('gray.50', 'gray.700');
  
  // Reset form when template changes
  useEffect(() => {
    if (isOpen) {
      reset(template || {
        name: '',
        subject: '',
        content: '',
        language: 'he',
        tags: [],
      });
      
      // Generate initial preview
      if (template?.content) {
        generatePreview(template.content);
      }
    }
  }, [isOpen, template, reset]);
  
  // Watch content changes to update preview
  useEffect(() => {
    if (currentContent) {
      generatePreview(currentContent);
    }
  }, [currentContent]);
  
  // Generate preview HTML
  const generatePreview = (content: string) => {
    // Replace variables with examples
    let previewContent = content;
    
    AVAILABLE_VARIABLES.forEach(variable => {
      previewContent = previewContent.replace(
        new RegExp(variable.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        `<span style="background-color: rgba(66, 153, 225, 0.2); border-radius: 3px; padding: 0 3px;">${variable.example}</span>`
      );
    });
    
    // Set direction based on language
    const direction = currentLanguage === 'en' ? 'ltr' : 'rtl';
    
    // Wrap in basic HTML structure
    const html = `
      <div style="direction: ${direction}; text-align: ${direction === 'rtl' ? 'right' : 'left'}; font-family: Arial, sans-serif; line-height: 1.6;">
        ${previewContent}
      </div>
    `;
    
    setPreviewHtml(html);
  };
  
  // Insert variable at cursor position
  const insertVariable = (variable: Variable) => {
    // Get textarea element
    const textarea = document.getElementById('email-content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    // Get cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Insert variable at cursor position
    const newContent = currentContent
      ? currentContent.substring(0, start) + variable.key + currentContent.substring(end)
      : variable.key;
    
    // Update form value
    setValue('content', newContent, { shouldDirty: true });
    
    // Focus back on textarea and set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + variable.key.length;
      textarea.selectionEnd = start + variable.key.length;
    }, 0);
  };
  
  // Format text with basic formatting
  const formatText = (type: string) => {
    // Get textarea element
    const textarea = document.getElementById('email-content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    // Get selection
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentContent ? currentContent.substring(start, end) : '';
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (type) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        cursorOffset = 17; // Length of <strong></strong>
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        cursorOffset = 9; // Length of <em></em>
        break;
      case 'list':
        formattedText = `\n<ul>\n  <li>${selectedText}</li>\n</ul>\n`;
        cursorOffset = 16; // Adjusted for multi-line
        break;
      case 'link':
        formattedText = `<a href="https://">${selectedText}</a>`;
        cursorOffset = 24; // Length of <a href="https://"></a>
        break;
      case 'align-left':
        formattedText = `<div style="text-align: left;">${selectedText}</div>`;
        cursorOffset = 34; // Length of style addition
        break;
      case 'align-center':
        formattedText = `<div style="text-align: center;">${selectedText}</div>`;
        cursorOffset = 36; // Length of style addition
        break;
      case 'align-right':
        formattedText = `<div style="text-align: right;">${selectedText}</div>`;
        cursorOffset = 35; // Length of style addition
        break;
      default:
        return;
    }
    
    // Insert formatted text
    const newContent = currentContent
      ? currentContent.substring(0, start) + formattedText + currentContent.substring(end)
      : formattedText;
    
    // Update form value
    setValue('content', newContent, { shouldDirty: true });
    
    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + formattedText.length;
      textarea.selectionEnd = start + formattedText.length;
    }, 0);
  };
  
  // Save template
  const onSubmit = async (data: Partial<EmailTemplate>) => {
    setLoading(true);
    
    try {
      if (template?.id) {
        // Update existing template
        // In a real app, this would be an API call:
        // const response = await api.put(`/api/email/templates/${template.id}`, data);
        // const updatedTemplate = response.data;
        
        // Mock update
        const updatedTemplate: EmailTemplate = {
          ...template,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        
        toast({
          title: t('emails.templateUpdated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSave) {
          onSave(updatedTemplate);
        }
      } else {
        // Create new template
        // In a real app, this would be an API call:
        // const response = await api.post('/api/email/templates', data);
        // const newTemplate = response.data;
        
        // Mock create
        const newTemplate: EmailTemplate = {
          id: Math.random().toString(36).substring(2, 11),
          ...data as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        toast({
          title: t('emails.templateCreated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSave) {
          onSave(newTemplate);
        }
      }
      
      onClose();
    } catch (error) {
      toast({
        title: template?.id ? t('emails.templateUpdateError') : t('emails.templateCreateError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {template?.id ? t('emails.editTemplate') : t('emails.newTemplate')}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <form id="template-form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" isLazy>
              <TabList>
                <Tab>{t('emails.editor')}</Tab>
                <Tab>{t('emails.preview')}</Tab>
                <Tab>{t('emails.variables')}</Tab>
              </TabList>
              
              <TabPanels>
                {/* Editor Panel */}
                <TabPanel p={4}>
                  <VStack spacing={4} align="stretch">
                    <FormControl isInvalid={!!errors.name} isRequired>
                      <FormLabel>{t('emails.templateName')}</FormLabel>
                      <Input
                        {...register('name', { 
                          required: t('emails.templateNameRequired') as string 
                        })}
                        placeholder={t('emails.templateNamePlaceholder')}
                      />
                      <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.subject} isRequired>
                      <FormLabel>{t('emails.subject')}</FormLabel>
                      <Input
                        {...register('subject', { 
                          required: t('emails.subjectRequired') as string 
                        })}
                        placeholder={t('emails.subjectPlaceholder')}
                      />
                      <FormErrorMessage>{errors.subject?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>{t('emails.language')}</FormLabel>
                      <Select {...register('language')}>
                        <option value="he">{t('emails.hebrew')}</option>
                        <option value="en">{t('emails.english')}</option>
                        <option value="both">{t('emails.bilingual')}</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.content} isRequired>
                      <Flex justify="space-between" align="center">
                        <FormLabel>{t('emails.content')}</FormLabel>
                        <HStack spacing={1}>
                          <Tooltip label={t('common.bold')}>
                            <IconButton
                              aria-label={t('common.bold')}
                              icon={<FiBold />}
                              size="sm"
                              variant="ghost"
                              onClick={() => formatText('bold')}
                            />
                          </Tooltip>
                          <Tooltip label={t('common.italic')}>
                            <IconButton
                              aria-label={t('common.italic')}
                              icon={<FiItalic />}
                              size="sm"
                              variant="ghost"
                              onClick={() => formatText('italic')}
                            />
                          </Tooltip>
                          <Tooltip label={t('common.list')}>
                            <IconButton
                              aria-label={t('common.list')}
                              icon={<FiList />}
                              size="sm"
                              variant="ghost"
                              onClick={() => formatText('list')}
                            />
                          </Tooltip>
                          <Tooltip label={t('common.link')}>
                            <IconButton
                              aria-label={t('common.link')}
                              icon={<FiLink />}
                              size="sm"
                              variant="ghost"
                              onClick={() => formatText('link')}
                            />
                          </Tooltip>
                          <Tooltip label={t('common.alignLeft')}>
                            <IconButton
                              aria-label={t('common.alignLeft')}
                              icon={<FiAlignLeft />}
                              size="sm"
                              variant="ghost"
                              onClick={() => formatText('align-left')}
                            />
                          </Tooltip>
                          <Tooltip label={t('common.alignCenter')}>
                            <IconButton
                              aria-label={t('common.alignCenter')}
                              icon={<FiAlignCenter />}
                              size="sm"
                              variant="ghost"
                              onClick={() => formatText('align-center')}
                            />
                          </Tooltip>
                          <Tooltip label={t('common.alignRight')}>
                            <IconButton
                              aria-label={t('common.alignRight')}
                              icon={<FiAlignRight />}
                              size="sm"
                              variant="ghost"
                              onClick={() => formatText('align-right')}
                            />
                          </Tooltip>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label={t('emails.insertVariable')}
                              icon={<FiCode />}
                              size="sm"
                              variant="ghost"
                            />
                            <MenuList>
                              <MenuItem fontWeight="bold" isDisabled>
                                {t('emails.availableVariables')}
                              </MenuItem>
                              <MenuDivider />
                              {AVAILABLE_VARIABLES.map((variable) => (
                                <MenuItem 
                                  key={variable.key}
                                  onClick={() => insertVariable(variable)}
                                >
                                  <Text fontWeight="medium">{variable.key}</Text>
                                  <Text fontSize="sm" color="gray.500" ml={2}>
                                    {variable.description}
                                  </Text>
                                </MenuItem>
                              ))}
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Flex>
                      
                      <Textarea
                        id="email-content"
                        {...register('content', { 
                          required: t('emails.contentRequired') as string 
                        })}
                        placeholder={t('emails.contentPlaceholder')}
                        minHeight="300px"
                        dir={currentLanguage === 'en' ? 'ltr' : 'rtl'}
                        textAlign={currentLanguage === 'en' ? 'left' : 'right'}
                        fontSize="md"
                        color={textareaColor}
                      />
                      <FormErrorMessage>{errors.content?.message}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>{t('emails.category')}</FormLabel>
                      <Select {...register('category')}>
                        <option value="">{t('emails.selectCategory')}</option>
                        <option value="followup">{t('emails.followup')}</option>
                        <option value="reminder">{t('emails.reminder')}</option>
                        <option value="notification">{t('emails.notification')}</option>
                        <option value="meeting">{t('emails.meeting')}</option>
                        <option value="other">{t('emails.other')}</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </TabPanel>
                
                {/* Preview Panel */}
                <TabPanel p={4}>
                  <Box mb={4}>
                    <Heading size="sm" mb={2}>{t('emails.subject')}</Heading>
                    <Box 
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      bg={previewBgColor}
                      dir={currentLanguage === 'en' ? 'ltr' : 'rtl'}
                      textAlign={currentLanguage === 'en' ? 'left' : 'right'}
                    >
                      {currentSubject || t('emails.noSubject')}
                    </Box>
                  </Box>
                  
                  <Heading size="sm" mb={2}>{t('emails.content')}</Heading>
                  <Box 
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    bg={previewBgColor}
                    minHeight="300px"
                    dangerouslySetInnerHTML={{ __html: previewHtml || t('emails.noContent') }}
                  />
                </TabPanel>
                
                {/* Variables Panel */}
                <TabPanel p={4}>
                  <Text mb={4}>{t('emails.variablesDescription')}</Text>
                  
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>{t('emails.variable')}</Th>
                        <Th>{t('emails.description')}</Th>
                        <Th>{t('emails.example')}</Th>
                        <Th width="50px">{t('common.actions')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {AVAILABLE_VARIABLES.map((variable) => (
                        <Tr key={variable.key}>
                          <Td>
                            <code>{variable.key}</code>
                          </Td>
                          <Td>
                            {variable.description}
                          </Td>
                          <Td>
                            {variable.example}
                          </Td>
                          <Td>
                            <IconButton
                              aria-label={t('common.insert')}
                              icon={<FiPlus />}
                              size="xs"
                              onClick={() => {
                                insertVariable(variable);
                                setActiveTab(0); // Switch back to editor tab
                              }}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </form>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button 
            colorScheme="blue" 
            type="submit"
            form="template-form"
            leftIcon={<FiSave />}
            isLoading={loading}
            loadingText={t('common.saving')}
          >
            {template?.id ? t('common.update') : t('common.create')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 