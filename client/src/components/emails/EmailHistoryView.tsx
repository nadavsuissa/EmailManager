import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  VStack,
  Tag,
  Tooltip,
  Spinner,
  useDisclosure,
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
  useToast,
} from '@chakra-ui/react';
import { 
  FiMail, 
  FiSearch, 
  FiFilter, 
  FiChevronDown, 
  FiEye, 
  FiTrash2, 
  FiTag, 
  FiExternalLink, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiMessageSquare,
  FiCalendar,
  FiUser,
  FiRefreshCw,
  FiMoreVertical,
} from 'react-icons/fi';
import { api } from '../../services/api';
import { formatRelativeDate, formatTime24Hour } from '../../utils/dateUtils';

interface EmailStatus {
  id: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  timestamp: string;
  details?: string;
}

interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
}

interface EmailHistoryItem {
  id: string;
  subject: string;
  content: string;
  sender: string;
  senderName?: string;
  recipient: string;
  recipientName?: string;
  date: string;
  read: boolean;
  outgoing: boolean;
  status?: EmailStatus[];
  tags?: string[];
  attachments?: EmailAttachment[];
  taskExtracted?: boolean;
  replyToId?: string;
  threadId?: string;
}

interface EmailHistoryViewProps {
  limit?: number;
  showFilters?: boolean;
}

export const EmailHistoryView: React.FC<EmailHistoryViewProps> = ({ 
  limit = 10,
  showFilters = true,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // States
  const [emails, setEmails] = useState<EmailHistoryItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailHistoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Styles
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  
  // Sample data - replace with API call
  useEffect(() => {
    fetchEmails();
  }, [currentPage, filterStatus, filterDirection, filterDate]);
  
  const fetchEmails = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/api/emails', {
      //   params: {
      //     page: currentPage,
      //     limit,
      //     status: filterStatus !== 'all' ? filterStatus : undefined,
      //     direction: filterDirection !== 'all' ? filterDirection : undefined,
      //     date: filterDate !== 'all' ? filterDate : undefined,
      //     search: searchTerm || undefined,
      //   }
      // });
      // setEmails(response.data.emails);
      
      // Mock data for now
      setTimeout(() => {
        const mockEmails: EmailHistoryItem[] = [
          {
            id: '1',
            subject: 'פגישת צוות שבועית',
            content: 'שלום לכולם, אנא אשרו את השתתפותכם בפגישה השבועית מחר בשעה 10:00.',
            sender: 'boss@company.com',
            senderName: 'המנהל שלך',
            recipient: 'me@example.com',
            date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: true,
            outgoing: false,
            tags: ['עבודה', 'פגישה'],
            status: [
              { id: '1-1', status: 'delivered', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
              { id: '1-2', status: 'opened', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() },
            ],
            threadId: 'thread1',
          },
          {
            id: '2',
            subject: 'אישור פגישת צוות',
            content: 'אני מאשר את השתתפותי בפגישה מחר.',
            sender: 'me@example.com',
            recipient: 'boss@company.com',
            recipientName: 'המנהל שלך',
            date: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
            read: true,
            outgoing: true,
            tags: ['עבודה', 'פגישה'],
            status: [
              { id: '2-1', status: 'sent', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() },
              { id: '2-2', status: 'delivered', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1 + 1000).toISOString() },
              { id: '2-3', status: 'opened', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
            ],
            replyToId: '1',
            threadId: 'thread1',
          },
          {
            id: '3',
            subject: 'הצעת מחיר לפרויקט',
            content: 'שלום, מצורפת הצעת מחיר עבור הפרויקט שדיברנו עליו.',
            sender: 'supplier@vendor.com',
            senderName: 'ספק',
            recipient: 'me@example.com',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            read: true,
            outgoing: false,
            tags: ['עבודה', 'פרויקט', 'דחוף'],
            attachments: [
              { id: '3-1', filename: 'הצעת_מחיר.pdf', size: 1240000, contentType: 'application/pdf' },
            ],
            taskExtracted: true,
            threadId: 'thread2',
          },
          {
            id: '4',
            subject: 'תזכורת: הגשת דו"ח חודשי',
            content: 'זוהי תזכורת להגשת הדו"ח החודשי עד סוף השבוע.',
            sender: 'system@company.com',
            senderName: 'מערכת תזכורות',
            recipient: 'me@example.com',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            read: false,
            outgoing: false,
            tags: ['עבודה', 'דוחות'],
            status: [
              { id: '4-1', status: 'delivered', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
            ],
            threadId: 'thread3',
          },
          {
            id: '5',
            subject: 'שינוי בלוח הזמנים של הפרויקט',
            content: 'שלום, עקב אילוצים בלתי צפויים, נאלצנו לדחות את תאריך היעד של הפרויקט בשבוע.',
            sender: 'pm@company.com',
            senderName: 'מנהל הפרויקט',
            recipient: 'me@example.com',
            date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            read: true,
            outgoing: false,
            tags: ['עבודה', 'פרויקט'],
            status: [
              { id: '5-1', status: 'delivered', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
              { id: '5-2', status: 'opened', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
            ],
            threadId: 'thread4',
          },
        ];
        
        setEmails(mockEmails);
        setLoading(false);
      }, 500);
    } catch (error) {
      toast({
        title: t('emails.loadingError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  // Filter emails based on search term
  const filteredEmails = emails.filter(email => {
    if (!searchTerm) return true;
    
    const searchFields = [
      email.subject,
      email.content,
      email.sender,
      email.senderName,
      email.recipient,
      email.recipientName,
    ].filter(Boolean);
    
    return searchFields.some(field => 
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Open email details
  const handleViewEmail = (email: EmailHistoryItem) => {
    setSelectedEmail(email);
    onOpen();
  };
  
  // Get status color based on email status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'blue';
      case 'delivered':
        return 'green';
      case 'opened':
        return 'purple';
      case 'clicked':
        return 'orange';
      case 'replied':
        return 'teal';
      case 'bounced':
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Refresh emails
  const handleRefresh = () => {
    fetchEmails();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterDirection('all');
    setFilterDate('all');
    setSearchTerm('');
  };
  
  // Get the latest status of an email
  const getLatestStatus = (email: EmailHistoryItem) => {
    if (!email.status || email.status.length === 0) {
      return email.outgoing ? 'sent' : 'received';
    }
    
    return email.status.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })[0].status;
  };
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{t('emails.history')}</Heading>
        <Button 
          leftIcon={<FiRefreshCw />} 
          colorScheme="blue" 
          variant="outline"
          size="sm" 
          onClick={handleRefresh}
          isLoading={loading}
        >
          {t('common.refresh')}
        </Button>
      </Flex>
      
      {showFilters && (
        <Flex 
          mb={4} 
          gap={4} 
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
        >
          <InputGroup maxW={{ base: '100%', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder={t('emails.searchEmails')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <HStack spacing={2} align="center">
            <Select 
              size="md" 
              maxW={{ base: '100%', md: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t('emails.allStatuses')}</option>
              <option value="sent">{t('emails.status.sent')}</option>
              <option value="delivered">{t('emails.status.delivered')}</option>
              <option value="opened">{t('emails.status.opened')}</option>
              <option value="replied">{t('emails.status.replied')}</option>
              <option value="failed">{t('emails.status.failed')}</option>
            </Select>
            
            <Select 
              size="md" 
              maxW={{ base: '100%', md: '150px' }}
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
            >
              <option value="all">{t('emails.allDirections')}</option>
              <option value="incoming">{t('emails.incoming')}</option>
              <option value="outgoing">{t('emails.outgoing')}</option>
            </Select>
            
            <Select 
              size="md" 
              maxW={{ base: '100%', md: '150px' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="all">{t('emails.allDates')}</option>
              <option value="today">{t('common.today')}</option>
              <option value="yesterday">{t('common.yesterday')}</option>
              <option value="thisWeek">{t('common.thisWeek')}</option>
              <option value="thisMonth">{t('common.thisMonth')}</option>
            </Select>
            
            <Button 
              size="md" 
              variant="ghost" 
              onClick={handleResetFilters} 
              leftIcon={<FiFilter />}
            >
              {t('common.reset')}
            </Button>
          </HStack>
        </Flex>
      )}
      
      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
        <Table variant="simple">
          <Thead bg={tableHeaderBg}>
            <Tr>
              <Th width="30%">{t('emails.subject')}</Th>
              <Th width="20%">{t('emails.participants')}</Th>
              <Th width="15%">{t('emails.date')}</Th>
              <Th width="20%">{t('emails.status')}</Th>
              <Th width="15%">{t('common.actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={10}>
                  <Spinner size="md" color="blue.500" mr={3} />
                  <Text display="inline-block">{t('common.loading')}</Text>
                </Td>
              </Tr>
            ) : filteredEmails.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={10}>
                  {t('emails.noEmailsFound')}
                </Td>
              </Tr>
            ) : (
              filteredEmails.map(email => (
                <Tr 
                  key={email.id} 
                  _hover={{ bg: 'gray.50' }}
                  cursor="pointer"
                  onClick={() => handleViewEmail(email)}
                  fontWeight={!email.read && !email.outgoing ? 'bold' : 'normal'}
                >
                  <Td>
                    <Flex align="center">
                      {!email.read && !email.outgoing && (
                        <Badge colorScheme="blue" mr={2} borderRadius="full">
                          {t('emails.new')}
                        </Badge>
                      )}
                      <Text noOfLines={1}>{email.subject}</Text>
                    </Flex>
                    {email.taskExtracted && (
                      <Badge colorScheme="green" mt={1} size="sm">
                        {t('emails.taskExtracted')}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <Flex align="center">
                      {email.outgoing ? (
                        <>
                          <Text fontSize="sm" color="gray.500">{t('emails.to')}:</Text>
                          <Text fontSize="sm" ml={1}>{email.recipientName || email.recipient}</Text>
                        </>
                      ) : (
                        <>
                          <Text fontSize="sm" color="gray.500">{t('emails.from')}:</Text>
                          <Text fontSize="sm" ml={1}>{email.senderName || email.sender}</Text>
                        </>
                      )}
                    </Flex>
                  </Td>
                  <Td>
                    <Tooltip label={new Date(email.date).toLocaleString()}>
                      <Text fontSize="sm">{formatRelativeDate(email.date)}</Text>
                    </Tooltip>
                    <Text fontSize="xs" color="gray.500">
                      {formatTime24Hour(email.date)}
                    </Text>
                  </Td>
                  <Td>
                    <Flex wrap="wrap" gap={2}>
                      <Badge colorScheme={email.outgoing ? 'blue' : 'purple'} variant="subtle">
                        {email.outgoing ? t('emails.outgoing') : t('emails.incoming')}
                      </Badge>
                      <Badge colorScheme={getStatusColor(getLatestStatus(email))} variant="subtle">
                        {t(`emails.status.${getLatestStatus(email)}`)}
                      </Badge>
                    </Flex>
                    {email.tags && email.tags.length > 0 && (
                      <Flex mt={1} gap={1} wrap="wrap">
                        {email.tags.map(tag => (
                          <Tag key={tag} size="sm" borderRadius="full" variant="subtle">
                            {tag}
                          </Tag>
                        ))}
                      </Flex>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label={t('common.view')}
                        icon={<FiEye />}
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewEmail(email);
                        }}
                      />
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label={t('common.more')}
                          icon={<FiMoreVertical />}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Actions
                        </MenuButton>
                        <MenuList onClick={(e) => e.stopPropagation()}>
                          {email.taskExtracted ? (
                            <MenuItem icon={<FiCheckCircle color="green" />}>
                              {t('emails.alreadyExtracted')}
                            </MenuItem>
                          ) : (
                            <MenuItem icon={<FiMessageSquare />}>
                              {t('emails.extractTasks')}
                            </MenuItem>
                          )}
                          <MenuItem icon={<FiTag />}>
                            {t('emails.manageLabels')}
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem icon={<FiTrash2 />} color="red.500">
                            {t('common.delete')}
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
      
      {/* Email Detail Modal */}
      {selectedEmail && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader borderBottomWidth="1px">
              <Text noOfLines={1}>{selectedEmail.subject}</Text>
              <Flex mt={2} gap={2} wrap="wrap">
                {selectedEmail.tags?.map(tag => (
                  <Tag key={tag} size="sm" borderRadius="full">
                    {tag}
                  </Tag>
                ))}
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <VStack spacing={4} align="stretch" py={2}>
                <Flex justify="space-between" align="flex-start">
                  <Box>
                    <Text color="gray.500">
                      {selectedEmail.outgoing ? t('emails.to') : t('emails.from')}:
                    </Text>
                    <Text fontWeight="bold">
                      {selectedEmail.outgoing 
                        ? (selectedEmail.recipientName || selectedEmail.recipient)
                        : (selectedEmail.senderName || selectedEmail.sender)
                      }
                    </Text>
                  </Box>
                  <Box textAlign="right">
                    <Text color="gray.500">{t('emails.date')}:</Text>
                    <Text>{new Date(selectedEmail.date).toLocaleString()}</Text>
                  </Box>
                </Flex>
                
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <Box>
                    <Text color="gray.500" mb={2}>{t('emails.attachments')}:</Text>
                    <HStack spacing={3}>
                      {selectedEmail.attachments.map(attachment => (
                        <Tag key={attachment.id} size="md" p={2} borderRadius="md" variant="outline">
                          <Text mr={2}>{attachment.filename}</Text>
                          <Text fontSize="xs" color="gray.500">
                            ({Math.round(attachment.size / 1024)} KB)
                          </Text>
                        </Tag>
                      ))}
                    </HStack>
                  </Box>
                )}
                
                <Box 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md"
                  bg={bgColor}
                  minHeight="200px"
                >
                  <Text whiteSpace="pre-wrap">
                    {selectedEmail.content}
                  </Text>
                </Box>
                
                {selectedEmail.status && selectedEmail.status.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={2}>{t('emails.trackingInfo')}:</Heading>
                    <VStack align="stretch" spacing={1}>
                      {selectedEmail.status
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                        .map(status => (
                          <Flex key={status.id} align="center" p={2} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                            <Badge colorScheme={getStatusColor(status.status)} mr={3}>
                              {t(`emails.status.${status.status}`)}
                            </Badge>
                            <Text fontSize="sm">
                              {new Date(status.timestamp).toLocaleString()}
                            </Text>
                            {status.details && (
                              <Text fontSize="sm" color="gray.500" ml={3}>
                                ({status.details})
                              </Text>
                            )}
                          </Flex>
                        ))
                      }
                    </VStack>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            
            <ModalFooter borderTopWidth="1px">
              <Button variant="ghost" mr={3} onClick={onClose}>
                {t('common.close')}
              </Button>
              <Button 
                colorScheme="blue" 
                mr={3}
                leftIcon={<FiMessageSquare />}
                isDisabled={selectedEmail.taskExtracted}
              >
                {selectedEmail.taskExtracted 
                  ? t('emails.alreadyExtracted') 
                  : t('emails.extractTasks')
                }
              </Button>
              <Button 
                colorScheme="green" 
                leftIcon={<FiExternalLink />}
              >
                {t('emails.openInInbox')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}; 