import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

const UserProductForm = () => {
  const [loading, setLoading] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    whatsappNumber: '',
    category: '',
    paymentMethod: 'bank_transfer',
    images: ['', '', '', '', ''],
  });

  // Available payment methods
  const paymentMethods = [
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'cod', name: 'Cash on Delivery' },
    { id: 'e_wallet', name: 'E-Wallet' },
  ];

  // Function to validate form data
  const validateForm = () => {
    if (!formData.productName.trim()) {
      throw new Error('Product name is required');
    }
    
    if (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      throw new Error('Please enter a valid price');
    }
    
    if (!formData.whatsappNumber.trim()) {
      throw new Error('WhatsApp number is required');
    }
    
    const waNumberRegex = /^(\+\d{1,3}\s?)?\d{10,14}$/;
    if (!waNumberRegex.test(formData.whatsappNumber.replace(/\s+/g, ''))) {
      throw new Error('Please enter a valid WhatsApp number');
    }
    
    if (!formData.description.trim()) {
      throw new Error('Product description is required');
    }
    
    // At least one image is required
    if (!formData.images.some(img => img.trim() !== '')) {
      throw new Error('Please add at least one product image');
    }
    
    // Validate all non-empty image URLs
    const nonEmptyImages = formData.images.filter(img => img.trim() !== '');
    for (const img of nonEmptyImages) {
      if (!validateImageUrl(img)) {
        throw new Error('Please enter valid image URLs');
      }
    }
    
    return true;
  };
  
  // Function to validate image URL
  const validateImageUrl = (url) => {
    if (!url) return false;
    
    try {
      new URL(url);
      
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      return validExtensions.some(ext => url.toLowerCase().endsWith(ext)) || 
             url.toLowerCase().includes('image') || 
             url.toLowerCase().includes('photo');
    } catch (e) {
      return false;
    }
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate form data
      validateForm();
      
      // Prepare product data
      const productData = {
        name: formData.productName.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        whatsappNumber: formData.whatsappNumber.trim(),
        category: formData.category.trim(),
        paymentMethod: formData.paymentMethod,
        images: formData.images.filter(img => img.trim() !== ''), // Only save non-empty image URLs
        createdAt: serverTimestamp(),
        status: 'pending', // Default status for new product submissions
        isActive: false, // Admin will activate later
      };
      
      // Save to Firebase
      await addDoc(collection(db, 'userProducts'), productData);
      
      // Show success message
      Alert.alert(
        'Success',
        'Your product has been submitted for review. We will notify you once it is approved.',
        [{ text: 'OK', onPress: () => setPaymentModalVisible(true) }]
      );
      
      // Reset form after successful submission
      setFormData({
        productName: '',
        description: '',
        price: '',
        whatsappNumber: '',
        category: '',
        paymentMethod: 'bank_transfer',
        images: ['', '', '', '', ''],
      });
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit product');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update image URL at specific index
  const updateImageUrl = (index, url) => {
    const newImages = [...formData.images];
    newImages[index] = url;
    setFormData({ ...formData, images: newImages });
  };

  // Function to preview image
  const previewImage = (url) => {
    if (url && url.trim() !== '') {
      setPreviewImageUrl(url);
      setImagePreviewVisible(true);
    }
  };

  // Payment instructions based on selected method
  const getPaymentInstructions = () => {
    switch (formData.paymentMethod) {
      case 'bank_transfer':
        return (
          <View style={styles.paymentInstructions}>
            <Text style={styles.instructionTitle}>Bank Transfer Instructions:</Text>
            <Text style={styles.instructionText}>1. Transfer to Bank BCA: 1234-5678-9012</Text>
            <Text style={styles.instructionText}>2. Account Name: PT. Your Company</Text>
            <Text style={styles.instructionText}>3. Amount: Rp {Number(formData.price).toLocaleString('id-ID')}</Text>
            <Text style={styles.instructionText}>4. Include your product name in the transfer note</Text>
            <Text style={styles.instructionText}>5. Send your transfer receipt to our WhatsApp: +62812345678</Text>
          </View>
        );
      case 'cod':
        return (
          <View style={styles.paymentInstructions}>
            <Text style={styles.instructionTitle}>Cash on Delivery Instructions:</Text>
            <Text style={styles.instructionText}>1. Your order will be processed within 24 hours</Text>
            <Text style={styles.instructionText}>2. Our courier will contact you before delivery</Text>
            <Text style={styles.instructionText}>3. Prepare exact amount: Rp {Number(formData.price).toLocaleString('id-ID')}</Text>
            <Text style={styles.instructionText}>4. Our WhatsApp support: +62812345678</Text>
          </View>
        );
      case 'e_wallet':
        return (
          <View style={styles.paymentInstructions}>
            <Text style={styles.instructionTitle}>E-Wallet Instructions:</Text>
            <Text style={styles.instructionText}>1. Scan the QR Code below or send to: 0812345678 (DANA/OVO/GoPay/ShopeePay)</Text>
            <Text style={styles.instructionText}>2. Amount: Rp {Number(formData.price).toLocaleString('id-ID')}</Text>
            <Text style={styles.instructionText}>3. Send your payment screenshot to our WhatsApp: +62812345678</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Your Product</Text>
          <Text style={styles.headerSubtitle}>Fill in the details to list your product</Text>
        </View>

        {/* Basic Product Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          
          <Text style={styles.label}>Product Name*</Text>
          <TextInput
            style={styles.input}
            value={formData.productName}
            onChangeText={(text) => setFormData({ ...formData, productName: text })}
            placeholder="Enter product name"
          />
          
          <Text style={styles.label}>Price* (Rp)</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9]/g, '') })}
            placeholder="Enter price in Rupiah"
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
            placeholder="Enter product category"
          />
          
          <Text style={styles.label}>Description*</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe your product in detail"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <Text style={styles.label}>WhatsApp Number*</Text>
          <TextInput
            style={styles.input}
            value={formData.whatsappNumber}
            onChangeText={(text) => setFormData({ ...formData, whatsappNumber: text })}
            placeholder="Ex: +6281234567890"
            keyboardType="phone-pad"
          />
        </View>

        {/* Product Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <Text style={styles.helperText}>Add up to 5 images of your product (at least 1 required)</Text>
          
          {formData.images.map((imageUrl, index) => (
            <View key={index} style={styles.imageInputContainer}>
              <View style={styles.imageUrlContainer}>
                <TextInput
                  style={[styles.input, styles.imageUrlInput]}
                  value={imageUrl}
                  onChangeText={(text) => updateImageUrl(index, text)}
                  placeholder={`Image URL ${index + 1}`}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={[styles.previewButton, !imageUrl && styles.disabledButton]}
                  onPress={() => imageUrl ? previewImage(imageUrl) : null}
                  disabled={!imageUrl}
                >
                  <Text style={[styles.previewButtonText, !imageUrl && styles.disabledText]}>
                    Preview
                  </Text>
                </TouchableOpacity>
              </View>
              
              {imageUrl && (
                <View style={styles.thumbnailContainer}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.thumbnail}
                    defaultSource={require('../../assets/images/placeholder.jpg')}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                formData.paymentMethod === method.id && styles.paymentOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, paymentMethod: method.id })}
            >
              <View style={styles.radioCircle}>
                {formData.paymentMethod === method.id && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.paymentMethodText}>{method.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Product</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
              {previewImageUrl ? (
                <Image
                  source={{ uri: previewImageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  defaultSource={require('../../assets/images/placeholder.jpg')}
                />
              ) : (
                <Text style={styles.noImageText}>No image URL provided</Text>     
              )}
            </View>
            
            <Text style={styles.imageUrlText} numberOfLines={2} ellipsizeMode="middle">
              {previewImageUrl}
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

      {/* Payment Instructions Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.paymentModalContainer}>
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>Payment Instructions</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            {getPaymentInstructions()}
            
            <TouchableOpacity
              style={styles.closePaymentButton}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.closePaymentButtonText}>Got It</Text>
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
  scrollView: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageInputContainer: {
    marginBottom: 16,
  },
  imageUrlContainer: {
    flexDirection: 'row',
    marginBottom: 8,
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
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  thumbnailContainer: {
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  paymentMethodText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
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
  paymentModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentInstructions: {
    marginVertical: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  closePaymentButton: {
    backgroundColor: '#7C3AED',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closePaymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default UserProductForm;