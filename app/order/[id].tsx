import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons, AntDesign, FontAwesome, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// Enhanced receipt generation function with beautiful design
const generateOrderReceipt = async (order) => {
  try {
    // Format date in a cleaner way
    const formatSimpleDate = (timestamp) => {
      if (!timestamp?.seconds) return '-';
      const date = new Date(timestamp.seconds * 1000);
      return `${date.getDate()} ${date.toLocaleDateString('id-ID', {month: 'long'})} ${date.getFullYear()}`;
    };

    // Create items HTML based on order details
    let itemsHtml = '';
    
    // If order has items array, use it
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach(item => {
        itemsHtml += `
          <tr>
            <td class="item-name">${item.name}</td>
            <td class="item-price">Rp ${item.price?.toLocaleString('id-ID')}</td>
          </tr>
        `;
      });
    } else {
      // Otherwise just show the product name
      itemsHtml = `
        <tr>
          <td class="item-name">${order.productName || '-'}</td>
          <td class="item-price">Rp ${order.amount?.toLocaleString('id-ID') || '0'}</td>
        </tr>
      `;
    }

    // Generate order number with leading zeros
    const formattedOrderNumber = order.orderNumber ? 
      `#${order.orderNumber.padStart(8, '0')}` : 
      '#00000001';

    // Fixed payment status based on order status
    const paymentStatus = order.status === 'completed' || order.status === 'processing' ? 'LUNAS' : 'BELUM LUNAS';
    const statusColor = paymentStatus === 'LUNAS' ? '#10B981' : '#EF4444';
    
    // Enhanced HTML template with better design
    const html = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Struk Pembayaran - TEFA APPS</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Poppins', 'Helvetica', Arial, sans-serif;
              background-color: #f7fafc;
              color: #1A202C;
              line-height: 1.6;
            }
            
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              overflow: hidden;
            }
            
            .receipt-header {
              background-color:rgb(5, 78, 121);
              padding: 30px;
              color: white;
              position: relative;
            }
            
            .wave-pattern {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 20px;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' fill='%23ffffff' opacity='.25'%3E%3C/path%3E%3C/svg%3E");
              background-size: cover;
              transform: rotate(180deg);
            }
            
            .logo-container {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
            }
            
            .logo-icon {
              width: 50px;
              height: 50px;
              background-color: white;
              position: relative;
              border-radius: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin-right: 15px;
            }
            
            .logo-icon:before {
              content: 'T';
              color:rgb(0, 24, 158);
              font-size: 30px;
              font-weight: bold;
            }
            
            .brand-name {
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 1px;
            }
            
            .receipt-title {
              font-size: 40px;
              font-weight: 800;
              margin-top: 10px;
              text-transform: uppercase;
            }
            
            .order-number {
              font-size: 16px;
              opacity: 0.9;
              margin-top: 5px;
            }
            
            .receipt-content {
              padding: 40px;
            }
            
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 30px;
              background-color: ${statusColor}15;
              color: ${statusColor};
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .info-section {
              display: flex;
              flex-wrap: wrap;
              margin-bottom: 40px;
              background-color: #F9FAFB;
              border-radius: 10px;
              padding: 20px;
            }
            
            .info-column {
              flex: 1;
              min-width: 250px;
              margin-bottom: 20px;
            }
            
            .info-item {
              margin-bottom: 15px;
            }
            
            .info-label {
              font-size: 14px;
              color: #6B7280;
              margin-bottom: 5px;
            }
            
            .info-value {
              font-size: 16px;
              font-weight: 600;
              color: #111827;
            }
            
            .product-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            
            .product-table th {
              text-align: left;
              padding: 15px 0;
              border-bottom: 2px solid #E5E7EB;
              color: #4B5563;
              font-weight: 600;
              font-size: 16px;
            }
            
            .product-table th:last-child {
              text-align: right;
            }
            
            .product-table td {
              padding: 20px 0;
              border-bottom: 1px solid #E5E7EB;
              font-size: 16px;
              color: #111827;
            }
            
            .item-name {
              font-weight: 500;
            }
            
            .item-price {
              text-align: right;
              font-weight: 600;
            }
            
            .total-row td {
              padding-top: 30px;
              font-size: 20px;
              font-weight: 700;
              color: #111827;
              border-bottom: none;
            }
            
            .payment-method {
              background-color: #F9FAFB;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 40px;
            }
            
            .payment-title {
              font-size: 16px;
              font-weight: 600;
              color: #4B5563;
              margin-bottom: 10px;
            }
            
            .payment-value {
              font-size: 18px;
              font-weight: 600;
              color: #111827;
            }
            
            .divider {
              height: 1px;
              background-color: #E5E7EB;
              margin: 40px 0;
              position: relative;
            }
            
            .divider:before {
              content: '';
              position: absolute;
              left: 0;
              top: -5px;
              height: 10px;
              width: 10px;
              background-color: #E5E7EB;
              border-radius: 50%;
            }
            
            .divider:after {
              content: '';
              position: absolute;
              right: 0;
              top: -5px;
              height: 10px;
              width: 10px;
              background-color: #E5E7EB;
              border-radius: 50%;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
            }
            
            .thank-you {
              font-size: 24px;
              font-weight: 700;
              color: #2E7D32;
              margin-bottom: 10px;
            }
            
            .contact-info {
              font-size: 14px;
              color: #6B7280;
              margin-bottom: 5px;
            }
            
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              margin-bottom: 40px;
              padding: 0 20px;
            }
            
            .signature-box {
              width: 45%;
              text-align: center;
            }
            
            .signature-line {
              height: 1px;
              background-color: #9CA3AF;
              margin-bottom: 10px;
            }
            
            .signature-name {
              font-size: 14px;
              font-weight: 600;
              color: #4B5563;
            }
            
            .receipt-footer {
              background-color:rgb(45, 35, 190);
              padding: 20px;
              text-align: center;
              color: white;
              font-size: 14px;
            }
            
            @media print {
              body {
                background-color: white;
              }
              
              .receipt-container {
                box-shadow: none;
                border-radius: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="logo-container">
                <div class="logo-icon"></div>
                <div>
                  <div class="brand-name">TEFA APPS</div>
                </div>
              </div>
              <div class="receipt-title">Bukti Transaksi</div>
              <div class="order-number">Nomor Pesanan: ${formattedOrderNumber}</div>
              <div class="wave-pattern"></div>
            </div>
            
            <div class="receipt-content">
              <div class="status-badge">${paymentStatus}</div>
              
              <div class="info-section">
                <div class="info-column">
                  <div class="info-item">
                    <div class="info-label">Nama Pelanggan</div>
                    <div class="info-value">${order.customerName || order.orderDetails?.username || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Tanggal Transaksi</div>
                    <div class="info-value">${formatSimpleDate(order.createdAt)}</div>
                  </div>
                </div>
                <div class="info-column">
                  ${order.orderDetails?.taskType ? `
                  <div class="info-item">
                    <div class="info-label">Jenis Tugas</div>
                    <div class="info-value">${order.orderDetails.taskType}</div>
                  </div>
                  ` : ''}
                  <div class="info-item">
                    <div class="info-label">Status Pesanan</div>
                    <div class="info-value" style="color: ${statusColor}">
                      ${order.status === 'completed' ? 'SELESAI' : 
                        order.status === 'pending' ? 'MENUNGGU PEMBAYARAN' : 
                        order.status === 'processing' ? 'SEDANG DIPROSES' : 'DIBATALKAN'}
                    </div>
                  </div>
                </div>
              </div>
              
              <table class="product-table">
                <thead>
                  <tr>
                    <th>Produk / Layanan</th>
                    <th>Harga</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr class="total-row">
                    <td>Total Pembayaran</td>
                    <td class="item-price">Rp ${order.amount?.toLocaleString('id-ID') || '0'}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="payment-method">
                <div class="payment-title">Metode Pembayaran</div>
                <div class="payment-value">${order.paymentMethod || 'Tunai'}</div>
                ${order.paymentAccountNumber ? `
                <div style="margin-top: 10px;">
                  <div class="payment-title">Nomor Rekening</div>
                  <div class="payment-value">${order.paymentAccountNumber}</div>
                </div>
                ` : ''}
                ${order.paymentAccountHolder ? `
                <div style="margin-top: 10px;">
                  <div class="payment-title">Atas Nama</div>
                  <div class="payment-value">${order.paymentAccountHolder}</div>
                </div>
                ` : ''}
              </div>
              
              ${order.orderDetails?.notes ? `
              <div style="margin-bottom: 40px;">
                <div class="payment-title">Catatan</div>
                <div style="background-color: #F9FAFB; border-radius: 10px; padding: 15px; font-size: 15px;">
                  ${order.orderDetails.notes}
                </div>
              </div>
              ` : ''}
              
              <div class="divider"></div>
              
              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">Pelanggan</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">Tim Kios Digital</div>
                </div>
              </div>
              
              <div class="footer">
                <div class="thank-you">Terima Kasih Atas Kepercayaan Anda</div>
                <div class="contact-info">Jika ada pertanyaan, silahkan hubungi kami di WhatsApp 081574623974</div>
                <div class="contact-info">KIOS DIGITAL © ${new Date().getFullYear()}</div>
              </div>
            </div>
            
            <div class="receipt-footer">
              Dokumen ini adalah bukti transaksi yang sah dari TEFA 
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF with improved page settings
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false,
      width: 595, // Standard A4 width in pixels at 72 DPI
      height: 842 // Standard A4 height in pixels at 72 DPI
    });
    
    // Save and share PDF with a better name
    const pdfName = `Struk_${order.orderNumber || 'Transaksi'}_KiosDigital.pdf`;
    const newUri = `${FileSystem.documentDirectory}${pdfName}`;
    
    try {
      await FileSystem.moveAsync({ from: uri, to: newUri });
    } catch (error) {
      // If move fails, try copying
      await FileSystem.copyAsync({ from: uri, to: newUri });
    }
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Bagikan Struk Transaksi',
        UTI: 'com.adobe.pdf'
      });
      return { success: true, uri: newUri };
    } else {
      throw new Error('Fitur berbagi tidak tersedia di perangkat Anda');
    }
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    throw error;
  }
};

const OrderDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('ID pesanan tidak valid');
        setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Pesanan tidak ditemukan');
        }
      } catch (error) {
        console.error('Error getting order:', error);
        setError('Gagal memuat data pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Fixed payment status logic to match order status
  const getPaymentStatus = (status) => {
    return status === 'completed' || status === 'processing' ? 'paid' : 'unpaid';
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = '6281574623974'; // Admin WhatsApp number
    const message = `Halo Admin, saya ingin konfirmasi pesanan dengan nomor: ${order?.orderNumber || 'tidak tersedia'}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp tidak terinstall di perangkat Anda');
      }
    }).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp');
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const handleGenerateReceipt = async () => {
    if (!order) {
      Alert.alert('Error', 'Data pesanan tidak tersedia');
      return;
    }
    
    try {
      setGeneratingReceipt(true);
      await generateOrderReceipt(order);
    } catch (error) {
      Alert.alert('Error', 'Gagal membuat struk: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setGeneratingReceipt(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="error-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>{error || 'Pesanan tidak ditemukan'}</Text>
        <TouchableOpacity 
          style={styles.backButtonEmpty}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonEmptyText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Payment status using updated logic
  const paymentStatus = getPaymentStatus(order.status);
  const isPaid = paymentStatus === 'paid';
  
  const statusColor = 
    order.status === 'completed' ? '#10B981' : 
    order.status === 'pending' ? '#F59E0B' : 
    order.status === 'processing' ? '#3B82F6' : 
    '#EF4444';

  const statusIcon = 
    order.status === 'completed' ? 'check-circle' : 
    order.status === 'pending' ? 'clock' : 
    order.status === 'processing' ? 'progress-clock' : 
    'close-circle';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <TouchableOpacity 
          onPress={handleGenerateReceipt} 
          disabled={generatingReceipt}
          style={styles.receiptButton}
        >
          {generatingReceipt ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="file-text" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumberLabel}>Nomor Pesanan</Text>
            <Text style={styles.orderNumber}>{order.orderNumber || '-'}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isPaid ? '#ECFDF5' : '#FEF2F2' }
          ]}>
            <Text style={[styles.statusText, { color: isPaid ? '#10B981' : '#EF4444' }]}>
              {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons name={statusIcon} size={24} color={statusColor} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusIndicatorText, {color: statusColor}]}>
              {order.status === 'completed' ? 'PESANAN SELESAI' : 
               order.status === 'pending' ? 'MENUNGGU PEMBAYARAN' : 
               order.status === 'processing' ? 'SEDANG DIPROSES' :
               order.status === 'canceled' ? 'PESANAN DIBATALKAN' : 'PESANAN GAGAL'}
            </Text>
            <Text style={styles.statusDate}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Detail Layanan</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nama Layanan</Text>
              <Text style={styles.detailValue}>{order.productName || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nama Lengkap</Text>
              <Text style={styles.detailValue}>{order.orderDetails?.username || '-'}</Text>
            </View>
            
            {order.orderDetails?.taskType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Jenis Tugas</Text>
                <Text style={styles.detailValue}>{order.orderDetails.taskType}</Text>
              </View>
            )}
            
            {order.orderDetails?.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Catatan:</Text>
                <Text style={styles.notesValue}>
                  {order.orderDetails.notes}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Detail Pembayaran</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Metode Pembayaran</Text>
              <Text style={styles.detailValue}>{order.paymentMethod || 'Tunai'}</Text>
            </View>
            
            {order.paymentAccountNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nomor Rekening</Text>
                <Text style={styles.detailValue}>{order.paymentAccountNumber}</Text>
              </View>
            )}
            
            {order.paymentAccountHolder && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Atas Nama</Text>
                <Text style={styles.detailValue}>{order.paymentAccountHolder}</Text>
              </View>
            )}
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Pembayaran</Text>
              <Text style={styles.priceValue}>
                Rp {order.amount?.toLocaleString('id-ID') || '0'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Show "Cetak Struk" button for all orders */}
        <TouchableOpacity 
          style={[styles.printButton, { backgroundColor: '#2E7D32' }]}
          onPress={handleGenerateReceipt}
          disabled={generatingReceipt}
        >
          {generatingReceipt ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <MaterialIcons name="receipt" size={20} color="white" />
              <Text style={styles.buttonText}>Cetak Struk</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Show "Tanya Admin" button for paid orders in processing state */}
        {order.status === 'processing' && (
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: '#4F46E5' }]}
            onPress={handleWhatsAppContact}
          >
            <FontAwesome 
              name="question-circle" 
              size={20} 
              color="white" 
            />
            <Text style={styles.contactButtonText}>
              Tanya Admin
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Show WhatsApp contact button for pending orders */}
        {order.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: '#25D366' }]}
            onPress={handleWhatsAppContact}
          >
            <FontAwesome 
              name="whatsapp" 
              size={20} 
              color="white" 
            />
            <Text style={styles.contactButtonText}>
              Konfirmasi Pembayaran
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButtonEmpty: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonEmptyText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  receiptButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderNumberLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusIndicatorText: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  notesContainer: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  notesValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  printButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderDetailScreen;