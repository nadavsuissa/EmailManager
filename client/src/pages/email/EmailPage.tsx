import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Grid,
  GridItem,
  VStack,
  HStack,
  Icon,
  Divider,
  useDisclosure,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  FiMail,
  FiSend,
  FiFilePlus,
  FiTag,
  FiSettings,
  FiPlusCircle,
  FiInbox,
  FiFileText,
  FiClock,
  FiActivity,
} from 'react-icons/fi';

import { EmailSetupWizard } from '../../components/emails/EmailSetupWizard';
import { EmailTaggingInterface } from '../../components/emails/EmailTaggingInterface';
import { EmailHistoryView } from '../../components/emails/EmailHistoryView';
import { EmailTemplateEditor } from '../../components/emails/EmailTemplateEditor';
import { api } from '../../services/api';

// Mock data for email accounts
const mockEmailAccounts = [
  { id: '1', name: 'עבודה', email: 'work@example.com', isActive: true },
  { id: '2', name: 'אישי', email: 'personal@example.com', isActive: false },
];

// Mock data for email templates
const mockTemplates = [
  { 
    id: '1', 
    name: 'תבנית ברכה', 
    subject: 'ברכות חמות!',
    content: 'שלום {{recipient.name}},\n\nברכות על ההישג המרשים שלך!\n\nבברכה,\n{{sender.name}}',
    language: 'he' as const,
    category: 'greeting',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '2', 
    name: 'תבנית תזכורת',
    subject: 'תזכורת: {{task.name}}',
    content: 'שלום {{recipient.name}},\n\nזוהי תזכורת על המשימה "{{task.name}}" שמועד הסיום שלה הוא {{task.deadline}}.\n\nבברכה,\n{{sender.name}}',
    language: 'he' as const,
    category: 'reminder',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const EmailPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toast = useToast();
  
  // State
  const [emailAccounts, setEmailAccounts] = useState(mockEmailAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [templates, setTemplates] = useState(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Disclosures for modals
  const {
    isOpen: isSetupWizardOpen,
    onOpen: onSetupWizardOpen,
    onClose: onSetupWizardClose,
  } = useDisclosure();
  
  const {
    isOpen: isTemplateEditorOpen,
    onOpen: onTemplateEditorOpen,
    onClose: onTemplateEditorClose,
  } = useDisclosure();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accountActiveBg = useColorModeValue('blue.50', 'blue.900');
  const accountHoverBg = useColorModeValue('gray.100', 'gray.700');
  
  // Set first account as active on load
  useEffect(() => {
    if (emailAccounts.length > 0 && !selectedAccountId) {
      const activeAccount = emailAccounts.find(acc => acc.isActive) || emailAccounts[0];
      setSelectedAccountId(activeAccount.id);
    }
  }, [emailAccounts, selectedAccountId]);
  
  // Open template editor with selected template or for new template
  const handleOpenTemplateEditor = (template?: any) => {
    setSelectedTemplate(template || null);
    onTemplateEditorOpen();
  };
  
  // Save template (update existing or create new)
  const handleSaveTemplate = (template: any) => {
    if (template.id && templates.some(t => t.id === template.id)) {
      // Update existing template
      setTemplates(
        templates.map(t => (t.id === template.id ? template : t))
      );
      toast({
        title: t('emails.templateUpdated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Add new template
      setTemplates([...templates, template]);
      toast({
        title: t('emails.templateCreated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm(t('emails.confirmDeleteTemplate'))) {
      setTemplates(templates.filter(t => t.id !== templateId));
      toast({
        title: t('emails.templateDeleted'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handle new email account setup
  const handleEmailAccountSetup = (accountId: string) => {
    console.log('New email account set up:', accountId);
    // In a real app, we would fetch the account details from the API
    // For now, we'll just add a mock account
    const newAccount = {
      id: accountId,
      name: 'חשבון חדש',
      email: `account${accountId}@example.com`,
      isActive: true,
    };
    
    // Set all accounts to inactive
    const updatedAccounts = emailAccounts.map(acc => ({ ...acc, isActive: false }));
    
    // Add new account and make it active
    setEmailAccounts([...updatedAccounts, newAccount]);
    setSelectedAccountId(accountId);
    
    toast({
      title: t('emails.accountAdded'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Select email account
  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    
    // Update active status in local state
    const updatedAccounts = emailAccounts.map(acc => ({
      ...acc,
      isActive: acc.id === accountId,
    }));
    
    setEmailAccounts(updatedAccounts);
  };
  
  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            {t('emails.title')}
          </Heading>
          <Text color="gray.500">
            {t('emails.subtitle')}
          </Text>
        </Box>
        <Button
          leftIcon={<FiPlusCircle />}
          colorScheme="blue"
          onClick={onSetupWizardOpen}
        >
          {t('emails.connectAccount')}
        </Button>
      </Flex>
      
      <Grid templateColumns={{ base: '1fr', md: '220px 1fr' }} gap={6}>
        {/* Sidebar */}
        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg={bgColor}
            >
              <Heading size="sm" mb={3}>
                {t('emails.accounts')}
              </Heading>
              <VStack align="stretch" spacing={2}>
                {emailAccounts.map(account => (
                  <Box
                    key={account.id}
                    p={3}
                    borderRadius="md"
                    bg={selectedAccountId === account.id ? accountActiveBg : undefined}
                    cursor="pointer"
                    onClick={() => handleSelectAccount(account.id)}
                    _hover={{ bg: accountHoverBg }}
                    transition="all 0.2s"
                  >
                    <Text fontWeight="medium">{account.name}</Text>
                    <Text fontSize="sm" color="gray.500">{account.email}</Text>
                  </Box>
                ))}
                <Button
                  leftIcon={<FiPlusCircle />}
                  size="sm"
                  variant="ghost"
                  onClick={onSetupWizardOpen}
                  mt={2}
                >
                  {t('emails.addAccount')}
                </Button>
              </VStack>
            </Box>
            
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg={bgColor}
            >
              <Heading size="sm" mb={3}>
                {t('emails.quickActions')}
              </Heading>
              <VStack align="stretch" spacing={2}>
                <Button
                  leftIcon={<FiSend />}
                  size="sm"
                  justifyContent="flex-start"
                  variant="ghost"
                >
                  {t('emails.compose')}
                </Button>
                <Button
                  leftIcon={<FiTag />}
                  size="sm"
                  justifyContent="flex-start"
                  variant="ghost"
                  onClick={() => setActiveTab(2)} // Switch to Tags tab
                >
                  {t('emails.manageTags')}
                </Button>
                <Button
                  leftIcon={<FiFileText />}
                  size="sm"
                  justifyContent="flex-start"
                  variant="ghost"
                  onClick={() => setActiveTab(3)} // Switch to Templates tab
                >
                  {t('emails.templates')}
                </Button>
                <Button
                  leftIcon={<FiSettings />}
                  size="sm"
                  justifyContent="flex-start"
                  variant="ghost"
                >
                  {t('emails.settings')}
                </Button>
              </VStack>
            </Box>
          </VStack>
        </GridItem>
        
        {/* Main Content */}
        <GridItem>
          <Box
            borderWidth="1px"
            borderRadius="md"
            bg={bgColor}
            overflow="hidden"
          >
            <Tabs 
              index={activeTab} 
              onChange={setActiveTab}
              colorScheme="blue"
              variant="enclosed"
            >
              <TabList px={4} pt={2}>
                <Tab>
                  <Icon as={FiInbox} mr={2} />
                  {t('emails.inbox')}
                </Tab>
                <Tab>
                  <Icon as={FiClock} mr={2} />
                  {t('emails.history')}
                </Tab>
                <Tab>
                  <Icon as={FiTag} mr={2} />
                  {t('emails.tags')}
                </Tab>
                <Tab>
                  <Icon as={FiFileText} mr={2} />
                  {t('emails.templates')}
                </Tab>
              </TabList>
              
              <TabPanels>
                {/* Inbox Tab */}
                <TabPanel p={4}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">{t('emails.inbox')}</Heading>
                    <Button leftIcon={<FiSend />} colorScheme="blue" size="sm">
                      {t('emails.compose')}
                    </Button>
                  </Flex>
                  <Box p={10} textAlign="center">
                    <Icon as={FiMail} boxSize="50px" color="gray.300" mb={4} />
                    <Heading size="md" mb={2}>
                      {t('emails.inboxComingSoon')}
                    </Heading>
                    <Text>
                      {t('emails.inboxDescription')}
                    </Text>
                  </Box>
                </TabPanel>
                
                {/* History Tab */}
                <TabPanel p={4}>
                  <EmailHistoryView showFilters={true} />
                </TabPanel>
                
                {/* Tags Tab */}
                <TabPanel p={4}>
                  <EmailTaggingInterface showStats={true} />
                </TabPanel>
                
                {/* Templates Tab */}
                <TabPanel p={4}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">{t('emails.emailTemplates')}</Heading>
                    <Button
                      leftIcon={<FiFilePlus />}
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleOpenTemplateEditor()}
                    >
                      {t('emails.newTemplate')}
                    </Button>
                  </Flex>
                  
                  {templates.length === 0 ? (
                    <Box p={10} textAlign="center">
                      <Icon as={FiFileText} boxSize="50px" color="gray.300" mb={4} />
                      <Heading size="md" mb={2}>
                        {t('emails.noTemplates')}
                      </Heading>
                      <Text mb={4}>
                        {t('emails.noTemplatesDesc')}
                      </Text>
                      <Button
                        colorScheme="blue"
                        onClick={() => handleOpenTemplateEditor()}
                      >
                        {t('emails.createFirstTemplate')}
                      </Button>
                    </Box>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {templates.map(template => (
                        <Box
                          key={template.id}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          _hover={{ borderColor: 'blue.300' }}
                          transition="all 0.2s"
                        >
                          <Flex justify="space-between" align="flex-start">
                            <VStack align="stretch" spacing={1}>
                              <Heading size="sm">{template.name}</Heading>
                              <Text color="gray.500" fontSize="sm">
                                {template.subject}
                              </Text>
                              <HStack mt={2}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<FiEdit2 />}
                                  onClick={() => handleOpenTemplateEditor(template)}
                                >
                                  {t('common.edit')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  leftIcon={<FiTrash2 />}
                                  onClick={() => handleDeleteTemplate(template.id)}
                                >
                                  {t('common.delete')}
                                </Button>
                              </HStack>
                            </VStack>
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </GridItem>
      </Grid>
      
      {/* Email Setup Wizard Modal */}
      <EmailSetupWizard
        isOpen={isSetupWizardOpen}
        onClose={onSetupWizardClose}
        onSuccess={handleEmailAccountSetup}
      />
      
      {/* Email Template Editor Modal */}
      <EmailTemplateEditor
        isOpen={isTemplateEditorOpen}
        onClose={onTemplateEditorClose}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
      />
    </Container>
  );
};

export default EmailPage; 