import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [news, setNews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    isActive: true,
    title: '',
    discountPercentage: '',
    validUntil: new Date(),
    content: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    notificationType: '',
    notificationMessage: '',
    isRead: false,
    priority: 'normal',
  });

  // Fetch data from Firestore
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let collectionName, setDataFunction;

      switch (activeTab) {
        case 'products':
          collectionName = 'products';
          setDataFunction = setProducts;
          break;
        case 'promotions':
          collectionName = 'promotions';
          setDataFunction = setPromotions;
          break;
        case 'news':
          collectionName = 'news';
          setDataFunction = setNews;
          break;
        case 'payments':
          collectionName = 'payments';
          setDataFunction = setPayments;
          break;
        case 'notifications':
          collectionName = 'notifications';
          setDataFunction = setNotifications;
          break;
        default:
          return;
      }

      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        // Convert Firestore Timestamps to Date objects
        Object.keys(docData).forEach(key => {
          if (docData[key] instanceof Timestamp) {
            docData[key] = docData[key].toDate();
          }
        });
        return { id: doc.id, ...docData };
      });

      setDataFunction(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateImageUrl = (url) => {
    if (!url) return false;
    
    // Basic URL validation
    try {
      new URL(url);
      
      // Check if URL ends with common image extensions
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      return validExtensions.some(ext => url.toLowerCase().endsWith(ext)) || 
             url.toLowerCase().includes('image') || 
             url.toLowerCase().includes('photo');
    } catch (e) {
      return false;
    }
  };

  const validateForm = () => {
    switch (activeTab) {
      case 'products':
        if (!formData.name || !formData.price) {
          throw new Error('Product name and price are required');
        }
        if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
          throw new Error('Price must be a valid number greater than 0');
        }
        if (formData.imageUrl && !validateImageUrl(formData.imageUrl)) {
          throw new Error('Please enter a valid image URL');
        }
        break;
      case 'promotions':
        if (!formData.title || !formData.discountPercentage) {
          throw new Error('Promotion title and discount percentage are required');
        }
        if (isNaN(Number(formData.discountPercentage)) || 
            Number(formData.discountPercentage) <= 0 || 
            Number(formData.discountPercentage) > 100) {
          throw new Error('Discount must be between 1-100%');
        }
        if (!formData.validUntil) {
          throw new Error('Valid until date is required');
        }
        if (formData.imageUrl && !validateImageUrl(formData.imageUrl)) {
          throw new Error('Please enter a valid image URL');
        }
        break;
      case 'news':
        if (!formData.title || !formData.content) {
          throw new Error('News title and content are required');
        }
        if (formData.imageUrl && !validateImageUrl(formData.imageUrl)) {
          throw new Error('Please enter a valid image URL');
        }
        break;
      case 'payments':
        if (!formData.bankName || !formData.accountNumber || !formData.accountHolder) {
          throw new Error('Bank name, account number, and account holder are required');
        }
        if (formData.imageUrl && !validateImageUrl(formData.imageUrl)) {
          throw new Error('Please enter a valid image URL');
        }
        break;
      case 'notifications':
        if (!formData.title || !formData.notificationType || !formData.notificationMessage) {
          throw new Error('Notification title, type, and message are required');
        }
        break;
      default:
        throw new Error('Invalid tab');
    }
  };

  const handleSubmit = async () => {
    try {
      validateForm();

      // Prepare data based on active tab
      let dataToSave = {};
      const now = Timestamp.now();

      switch (activeTab) {
        case 'products':
          dataToSave = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: Number(formData.price),
            category: formData.category.trim(),
            isActive: Boolean(formData.isActive),
            updatedAt: now,
            imageUrl: formData.imageUrl.trim(),
          };
          break;
          
        case 'promotions':
          dataToSave = {
            title: formData.title.trim(),
            discountPercentage: Number(formData.discountPercentage),
            validUntil: Timestamp.fromDate(formData.validUntil),
            updatedAt: now,
            imageUrl: formData.imageUrl.trim(),
          };
          break;
          
        case 'news':
          dataToSave = {
            title: formData.title.trim(),
            content: formData.content.trim(),
            updatedAt: now,
            imageUrl: formData.imageUrl.trim(),
          };
          break;
          
        case 'payments':
          dataToSave = {
            bankName: formData.bankName.trim(),
            accountNumber: formData.accountNumber.trim(),
            accountHolder: formData.accountHolder.trim(),
            description: formData.description.trim(),
            imageUrl: formData.imageUrl.trim(),
            isActive: Boolean(formData.isActive),
            updatedAt: now,
          };
          break;
          
        case 'notifications':
          dataToSave = {
            title: formData.title.trim(),
            notificationType: formData.notificationType.trim(),
            notificationMessage: formData.notificationMessage.trim(),
            isRead: Boolean(formData.isRead),
            priority: formData.priority,
            updatedAt: now,
          };
          break;
      }

      const collectionName = activeTab;
      console.log('Data to save:', dataToSave);

      if (currentItem) {
        // Update existing document
        await updateDoc(doc(db, collectionName, currentItem.id), dataToSave);
        Alert.alert('Success', 'Item updated successfully');
      } else {
        // Add new document
        dataToSave.createdAt = now;
        await addDoc(collection(db, collectionName), dataToSave);
        Alert.alert('Success', 'Item added successfully');
      }

      setModalVisible(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'An error occurred while saving data');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const collectionName = activeTab;
              await deleteDoc(doc(db, collectionName, id));
              await fetchData();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      imageUrl: '',
      isActive: true,
      title: '',
      discountPercentage: '',
      validUntil: new Date(),
      content: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      notificationType: '',
      notificationMessage: '',
      isRead: false,
      priority: 'normal',
    });
    setCurrentItem(null);
    setImagePreviewVisible(false);
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || '',
      imageUrl: item.imageUrl || '',
      isActive: item.isActive ?? true,
      title: item.title || '',
      discountPercentage: item.discountPercentage?.toString() || '',
      validUntil: item.validUntil instanceof Date ? item.validUntil : new Date(),
      content: item.content || '',
      bankName: item.bankName || '',
      accountNumber: item.accountNumber || '',
      accountHolder: item.accountHolder || '',
      notificationType: item.notificationType || '',
      notificationMessage: item.notificationMessage || '',
      isRead: item.isRead ?? false,
      priority: item.priority || 'normal',
    });
    setModalVisible(true);
  };

  const renderItemList = () => {
    const items = activeTab === 'products' ? products :
                 activeTab === 'promotions' ? promotions :
                 activeTab === 'news' ? news :
                 activeTab === 'payments' ? payments :
                 notifications;

    if (items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data found</Text>
        </View>
      );
    }

    return items.map(item => (
      <View key={item.id} style={styles.itemCard}>
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.itemImage} 
            defaultSource={require('../../assets/images/placeholder.jpg')}
          />
        )}
        <View style={styles.itemDetails}>
          {/* Products display */}
          {activeTab === 'products' && (
            <>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
              {item.isActive !== undefined && (
                <Text style={[styles.itemStatus, { color: item.isActive ? 'green' : 'red' }]}>
                  Status: {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              )}
            </>
          )}
          
          {/* Promotions display */}
          {activeTab === 'promotions' && (
            <>
              <Text style={styles.itemName}>{item.title}</Text>
              <Text style={styles.itemDiscount}>Discount: {item.discountPercentage}%</Text>
              <Text style={styles.itemDate}>
                Valid until: {item.validUntil.toLocaleDateString('id-ID')}
              </Text>
            </>
          )}
          
          {/* News display */}
          {activeTab === 'news' && (
            <>
              <Text style={styles.itemName}>{item.title}</Text>
              <Text style={styles.itemDate}>
                Created: {item.createdAt?.toLocaleDateString('id-ID') || 'N/A'}
              </Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.content}
              </Text>
            </>
          )}
          
          {/* Payments display */}
          {activeTab === 'payments' && (
            <>
              <Text style={styles.itemName}>{item.bankName}</Text>
              <Text style={styles.itemDetails}>{item.accountNumber}</Text>
              <Text style={styles.itemDetails}>{item.accountHolder}</Text>
              {item.isActive !== undefined && (
                <Text style={[styles.itemStatus, { color: item.isActive ? 'green' : 'red' }]}>
                  Status: {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              )}
            </>
          )}
          
          {/* Notifications display */}
          {activeTab === 'notifications' && (
            <>
              <Text style={styles.itemName}>{item.title}</Text>
              <Text style={styles.itemType}>Type: {item.notificationType}</Text>
              <Text style={[styles.itemStatus, { color: item.isRead ? 'green' : 'orange' }]}>
                Status: {item.isRead ? 'Read' : 'Unread'}
              </Text>
              <Text style={[styles.itemPriority, { 
                color: item.priority === 'high' ? 'red' : 
                      item.priority === 'normal' ? 'blue' : 'gray'
              }]}>
                Priority: {item.priority || 'normal'}
              </Text>
            </>
          )}
          
          {item.imageUrl && (
            <Text 
              style={styles.viewImage}
              onPress={() => {
                setFormData({...formData, imageUrl: item.imageUrl});
                setImagePreviewVisible(true);
              }}
            >
              View Image
            </Text>
          )}
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.actionButton}
          >
            <FontAwesome name="edit" size={20} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.actionButton}
          >
            <FontAwesome name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'products':
        return (
          <>
            <Text style={styles.label}>Product Name*</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Product name"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Product description"
              multiline
            />

            <Text style={styles.label}>Price* (Rp)</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9]/g, '') })}
              placeholder="Price in Rupiah"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              placeholder="Product category"
            />

            <Text style={styles.label}>Image URL</Text>
            <View style={styles.imageUrlContainer}>
              <TextInput
                style={[styles.input, styles.imageUrlInput]}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                placeholder="https://example.com/image.jpg"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => formData.imageUrl ? setImagePreviewVisible(true) : null}
                disabled={!formData.imageUrl}
              >
                <Text style={[styles.previewButtonText, !formData.imageUrl && styles.disabledText]}>
                  Preview
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Active Status</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
              />
            </View>
          </>
        );
      case 'promotions':
        return (
          <>
            <Text style={styles.label}>Promotion Title*</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Promotion title"
            />

            <Text style={styles.label}>Discount Percentage*</Text>
            <TextInput
              style={styles.input}
              value={formData.discountPercentage}
              onChangeText={(text) => setFormData({ ...formData, discountPercentage: text.replace(/[^0-9]/g, '') })}
              placeholder="10"
              keyboardType="numeric"
              maxLength={3}
            />

            <Text style={styles.label}>Valid Until*</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text>{formData.validUntil.toLocaleDateString('id-ID')}</Text>
            </TouchableOpacity>

            {datePickerVisible && (
              <DateTimePicker
                value={formData.validUntil}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setDatePickerVisible(false);
                  if (date) {
                    setFormData({ ...formData, validUntil: date });
                  }
                }}
              />
            )}

            <Text style={styles.label}>Image URL</Text>
            <View style={styles.imageUrlContainer}>
              <TextInput
                style={[styles.input, styles.imageUrlInput]}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                placeholder="https://example.com/image.jpg"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => formData.imageUrl ? setImagePreviewVisible(true) : null}
                disabled={!formData.imageUrl}
              >
                <Text style={[styles.previewButtonText, !formData.imageUrl && styles.disabledText]}>
                  Preview
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 'news':
        return (
          <>
            <Text style={styles.label}>News Title*</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="News title"
            />

            <Text style={styles.label}>News Content*</Text>
            <TextInput
              style={[styles.input, styles.multilineInput, { height: 150 }]}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholder="News content"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Image URL</Text>
            <View style={styles.imageUrlContainer}>
              <TextInput
                style={[styles.input, styles.imageUrlInput]}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                placeholder="https://example.com/image.jpg"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => formData.imageUrl ? setImagePreviewVisible(true) : null}
                disabled={!formData.imageUrl}
              >
                <Text style={[styles.previewButtonText, !formData.imageUrl && styles.disabledText]}>
                  Preview
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 'payments':
        return (
          <>
            <Text style={styles.label}>Bank Name*</Text>
            <TextInput
              style={styles.input}
              value={formData.bankName}
              onChangeText={(text) => setFormData({ ...formData, bankName: text })}
              placeholder="Bank name (e.g., BCA, Mandiri, BNI)"
            />

            <Text style={styles.label}>Account Number*</Text>
            <TextInput
              style={styles.input}
              value={formData.accountNumber}
              onChangeText={(text) => setFormData({ ...formData, accountNumber: text.replace(/[^0-9]/g, '') })}
              placeholder="Account number"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Account Holder*</Text>
            <TextInput
              style={styles.input}
              value={formData.accountHolder}
              onChangeText={(text) => setFormData({ ...formData, accountHolder: text })}
              placeholder="Account holder name"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Additional information"
              multiline
            />

            <Text style={styles.label}>Bank Logo URL</Text>
            <View style={styles.imageUrlContainer}>
              <TextInput
                style={[styles.input, styles.imageUrlInput]}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                placeholder="https://example.com/bank-logo.jpg"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => formData.imageUrl ? setImagePreviewVisible(true) : null}
                disabled={!formData.imageUrl}
              >
                <Text style={[styles.previewButtonText, !formData.imageUrl && styles.disabledText]}>
                  Preview
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Active Status</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
              />
            </View>
          </>
        );
      case 'notifications':
        return (
          <>
            <Text style={styles.label}>Notification Title*</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Notification title"
            />

            <Text style={styles.label}>Notification Type*</Text>
            <TextInput
              style={styles.input}
              value={formData.notificationType}
              onChangeText={(text) => setFormData({ ...formData, notificationType: text })}
              placeholder="Type (e.g., promo, system, order)"
            />

            <Text style={styles.label}>Notification Message*</Text>
            <TextInput
              style={[styles.input, styles.multilineInput, { height: 120 }]}
              value={formData.notificationMessage}
              onChangeText={(text) => setFormData({ ...formData, notificationMessage: text })}
              placeholder="Notification message"
              multiline
              textAlignVertical="top"
            />
            
            <Text style={styles.label}>Priority</Text>
            <View style={styles.radioGroup}>
              {['low', 'normal', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.radioButton,
                    formData.priority === priority && styles.radioButtonSelected
                  ]}
                  onPress={() => setFormData({ ...formData, priority })}
                >
                  <Text style={[
                    styles.radioText,
                    formData.priority === priority && styles.radioTextSelected
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Mark as Read</Text>
              <Switch
                value={formData.isRead}
                onValueChange={(value) => setFormData({ ...formData, isRead: value })}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
              />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Admin Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
        <View style={styles.tabs}>
          {['products', 'promotions', 'news', 'payments', 'notifications'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'products' ? 'Products' :
                 tab === 'promotions' ? 'Promotions' : 
                 tab === 'news' ? 'News' :
                 tab === 'payments' ? 'Payments' : 'Notifications'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Add New Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Add New</Text>
          </TouchableOpacity>

          {/* List Items */}
          {renderItemList()}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {currentItem ? 'Edit Item' : 'Add New Item'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          {renderFormFields()}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {currentItem ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <View style={styles.imagePreviewModalContainer}>
          <View style={styles.imagePreviewContent}>
            <View style={styles.imagePreviewHeader}>
              <Text style={styles.imagePreviewTitle}>Image Preview</Text>
              <TouchableOpacity onPress={() => setImagePreviewVisible(false)}>
                <MaterialIcons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageContainer}>
              {formData.imageUrl ? (
                <Image
                  source={{ uri: formData.imageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  defaultSource={require('../../assets/images/placeholder.jpg')}
                />
              ) : (
                <Text style={styles.noImageText}>No image URL provided</Text>     
              )}
            </View>
            
            <Text style={styles.imageUrlText} numberOfLines={2} ellipsizeMode="middle">
              {formData.imageUrl}
            </Text>
            
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setImagePreviewVisible(false)}
            >
              <Text style={styles.closePreviewButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabScrollView: {
    maxHeight: 50,
    backgroundColor: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    color: '#1F2937',
  },
  itemPrice: {
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDiscount: {
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDate: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemType: {
    color: '#4B5563',
    fontSize: 13,
    marginBottom: 4,
  },
  itemPriority: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  itemDescription: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  viewImage: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 16,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  label: {
    marginBottom: 8,
    color: '#4B5563',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageUrlContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageUrlInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  previewButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#A1A1AA',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioButtonSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  radioText: {
    color: '#4B5563',
  },
  radioTextSelected: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePreviewModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePreviewContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  imagePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  imagePreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  imageContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  noImageText: {
    color: '#6B7280',
  },
  imageUrlText: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  closePreviewButton: {
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closePreviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AdminDashboard;