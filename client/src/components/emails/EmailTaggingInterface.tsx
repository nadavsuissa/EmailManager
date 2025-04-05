import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Wrap,
  WrapItem,
  Badge,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { FiPlus, FiSave, FiEdit2, FiTrash2, FiTag, FiSearch } from 'react-icons/fi';
import { api } from '../../services/api';
import { AppDispatch } from '../../store/store';

interface EmailTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  count?: number;
  isSystem?: boolean;
}

interface EmailTaggingInterfaceProps {
  showStats?: boolean;
}

export const EmailTaggingInterface: React.FC<EmailTaggingInterfaceProps> = ({ showStats = true }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // States
  const [tags, setTags] = useState<EmailTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<EmailTag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('blue');
  const [newTagDescription, setNewTagDescription] = useState('');
  
  // Colors
  const colors = [
    'red', 'orange', 'yellow', 'green', 'teal', 'blue', 
    'cyan', 'purple', 'pink', 'gray'
  ];
  
  // Background and border colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);
  
  // Fetch tags from API
  const fetchTags = async () => {
    setLoading(true);
    try {
      // This would be replaced with actual API call
      // const response = await api.get('/api/email/tags');
      // setTags(response.data);
      
      // Mock data for now
      setTags([
        { id: '1', name: 'דחוף', color: 'red', count: 5, description: 'אימיילים שדורשים טיפול מיידי' },
        { id: '2', name: 'עבודה', color: 'blue', count: 12, description: 'אימיילים הקשורים לעבודה' },
        { id: '3', name: 'אישי', color: 'green', count: 8, description: 'אימיילים אישיים' },
        { id: '4', name: 'לטיפול', color: 'orange', count: 7, description: 'אימיילים שדורשים טיפול' },
        { id: '5', name: 'אוטומטי', color: 'purple', count: 3, description: 'אימיילים שנוצרו אוטומטית', isSystem: true },
      ]);
    } catch (error) {
      toast({
        title: t('emails.tagsLoadError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter tags based on search query
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Open edit modal with selected tag
  const handleEditTag = (tag: EmailTag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagDescription(tag.description || '');
    onOpen();
  };
  
  // Open create modal
  const handleCreateTag = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('blue');
    setNewTagDescription('');
    onOpen();
  };
  
  // Save tag (create or update)
  const handleSaveTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: t('emails.tagNameRequired'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    try {
      if (editingTag) {
        // Update existing tag
        // await api.put(`/api/email/tags/${editingTag.id}`, {
        //   name: newTagName,
        //   color: newTagColor,
        //   description: newTagDescription
        // });
        
        // Mock update
        setTags(tags.map(tag => 
          tag.id === editingTag.id 
            ? { ...tag, name: newTagName, color: newTagColor, description: newTagDescription }
            : tag
        ));
        
        toast({
          title: t('emails.tagUpdated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new tag
        // const response = await api.post('/api/email/tags', {
        //   name: newTagName,
        //   color: newTagColor,
        //   description: newTagDescription
        // });
        
        // Mock create
        const newTag: EmailTag = {
          id: Date.now().toString(),
          name: newTagName,
          color: newTagColor,
          description: newTagDescription,
          count: 0
        };
        
        setTags([...tags, newTag]);
        
        toast({
          title: t('emails.tagCreated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: editingTag ? t('emails.tagUpdateError') : t('emails.tagCreateError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Delete tag
  const handleDeleteTag = async (tagId: string) => {
    if (window.confirm(t('emails.confirmDeleteTag'))) {
      setLoading(true);
      try {
        // await api.delete(`/api/email/tags/${tagId}`);
        
        // Mock delete
        setTags(tags.filter(tag => tag.id !== tagId));
        
        toast({
          title: t('emails.tagDeleted'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: t('emails.tagDeleteError'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{t('emails.tags')}</Heading>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue" 
          size="sm" 
          onClick={handleCreateTag}
        >
          {t('emails.newTag')}
        </Button>
      </Flex>
      
      <InputGroup mb={4}>
        <Input
          placeholder={t('emails.searchTags')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputRightElement>
          <FiSearch color="gray.300" />
        </InputRightElement>
      </InputGroup>
      
      {showStats && (
        <Box mb={6} p={4} borderWidth="1px" borderRadius="md" bg={bgColor}>
          <Heading size="sm" mb={3}>{t('emails.tagStats')}</Heading>
          <Wrap spacing={3}>
            {tags.map(tag => (
              <WrapItem key={tag.id}>
                <Tag
                  size="md"
                  borderRadius="full"
                  variant="solid"
                  colorScheme={tag.color}
                >
                  <TagLabel>{tag.name}</TagLabel>
                  <Badge 
                    ml={1} 
                    fontSize="0.8em" 
                    bg="white" 
                    color={`${tag.color}.500`}
                    borderRadius="full"
                  >
                    {tag.count}
                  </Badge>
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
      
      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
        <Table variant="simple" size="sm">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>{t('emails.tagName')}</Th>
              <Th>{t('emails.tagColor')}</Th>
              <Th>{t('emails.tagCount')}</Th>
              <Th width="40px">{t('common.actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredTags.length === 0 ? (
              <Tr>
                <Td colSpan={4} textAlign="center" py={4}>
                  {t('emails.noTagsFound')}
                </Td>
              </Tr>
            ) : (
              filteredTags.map(tag => (
                <Tr key={tag.id}>
                  <Td>
                    <Flex align="center">
                      <Tag
                        size="sm"
                        borderRadius="full"
                        variant="solid"
                        colorScheme={tag.color}
                        mr={2}
                      >
                        <FiTag size="10" />
                      </Tag>
                      <Text fontWeight="medium">{tag.name}</Text>
                      {tag.isSystem && (
                        <Badge ml={2} colorScheme="purple" fontSize="0.7em">
                          {t('emails.systemTag')}
                        </Badge>
                      )}
                    </Flex>
                    {tag.description && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {tag.description}
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <Tag
                      size="sm"
                      borderRadius="full"
                      variant="solid"
                      colorScheme={tag.color}
                    >
                      {tag.color}
                    </Tag>
                  </Td>
                  <Td>{tag.count}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        aria-label={t('common.edit')}
                        icon={<FiEdit2 />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTag(tag)}
                        isDisabled={tag.isSystem}
                      />
                      <IconButton
                        aria-label={t('common.delete')}
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteTag(tag.id)}
                        isDisabled={tag.isSystem}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
      
      {/* Create/Edit Tag Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingTag ? t('emails.editTag') : t('emails.createTag')}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>{t('emails.tagName')}</FormLabel>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t('emails.tagNamePlaceholder')}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>{t('emails.tagDescription')}</FormLabel>
                <Input
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  placeholder={t('emails.tagDescriptionPlaceholder')}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>{t('emails.tagColor')}</FormLabel>
                <Wrap spacing={2}>
                  {colors.map(color => (
                    <WrapItem key={color}>
                      <IconButton
                        aria-label={`${color} color`}
                        icon={<FiTag />}
                        size="md"
                        colorScheme={color}
                        variant={newTagColor === color ? 'solid' : 'outline'}
                        onClick={() => setNewTagColor(color)}
                      />
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>
              
              <Box p={3} borderWidth="1px" borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                <Text mb={2}>{t('emails.tagPreview')}:</Text>
                <Tag
                  size="lg"
                  borderRadius="full"
                  variant="solid"
                  colorScheme={newTagColor}
                >
                  <TagLabel>{newTagName || t('emails.tagNamePlaceholder')}</TagLabel>
                </Tag>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              colorScheme="blue" 
              leftIcon={<FiSave />}
              onClick={handleSaveTag}
              isLoading={loading}
            >
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 