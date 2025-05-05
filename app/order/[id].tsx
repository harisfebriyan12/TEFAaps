import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Image, Share, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as Animatable from 'react-native-animatable';
import { ArrowLeft, Package, Clock, CircleCheck, Circle, CreditCard, MessageSquare, FileText, ExternalLink, MapPin, Calendar, DollarSign, User, Mail, Download } from 'lucide-react-native';
import moment from 'moment';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const COLORS = {
  primary: '#0557B5',
  primaryLight: '#E1EFFF',
  primaryDark: '#044289',
  secondary: '#2C7DFA',
  accent: '#70B3FF',
  success: '#00B884',
  successLight: '#E6F9F4',
  warning: '#FF9D00',
  warningLight: '#FFF5E6',
  danger: '#FF4757',
  dangerLight: '#FFECEE',
  neutral: '#F8FAFC',
  neutralDark: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  white: '#FFFFFF',
  headerBlue: '#1E88E5',
};

const ORDER_STATUS = {
  pending: {
    label: 'Menunggu Pembayaran',
    color: COLORS.warning,
    icon: Clock,
    bgColor: COLORS.warningLight,
    description: 'Pesanan Anda sedang menunggu pembayaran'
  },
  processing: {
    label: 'Diproses',
    color: COLORS.secondary,
    icon: Package,
    bgColor: COLORS.primaryLight,
    description: 'Pesanan Anda sedang diproses oleh tim kami'
  },
  approved: {
    label: 'Selesai',
    color: COLORS.success,
    icon: CircleCheck,
    bgColor: COLORS.successLight,
    description: 'Pesanan Anda telah selesai'
  },
  cancelled: {
    label: 'Dibatalkan',
    color: COLORS.danger,
    icon: Circle,
    bgColor: COLORS.dangerLight,
    description: 'Pesanan Anda telah dibatalkan'
  }
};

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', id as string));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Format the date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Tidak tersedia';
    return moment(timestamp.seconds * 1000).format('DD MMMM YYYY, HH:mm');
  };

// Replace the generateInvoiceHtml function with this improved version

const generateInvoiceHtml = (order) => {
  const orderDate = order.createdAt ? moment(order.createdAt.seconds * 1000).format('DD MMMM YYYY') : 'N/A';
  const dueDate = order.deadline ? moment(order.deadline.seconds * 1000).format('DD MMMM YYYY') : 'N/A';
  const invoiceDate = moment().format('DD MMMM YYYY');
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Invoice #${order.orderNumber}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        color: #1E293B;
        background-color: #F8FAFC;
        line-height: 1.5;
      }
      
      .invoice-container {
        max-width: 800px;
        margin: 40px auto;
        padding: 40px;
        background-color: white;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        border-radius: 12px;
      }
      
      .invoice-header {
        display: flex;
        justify-content: space-between;
        padding-bottom: 24px;
        border-bottom: 1px solid #E2E8F0;
      }
      
      .logo-container {
        display: flex;
        flex-direction: column;
      }
      
      .logo {
        font-size: 32px;
        font-weight: 700;
        color: #0557B5;
        letter-spacing: -0.5px;
        margin-bottom: 8px;
      }
      
      .tagline {
        font-size: 14px;
        color: #64748B;
      }
      
      .company-details {
        text-align: right;
        font-size: 14px;
        color: #64748B;
        line-height: 1.6;
      }
      
      .company-name {
        font-size: 18px;
        font-weight: 600;
        color: #1E293B;
        margin-bottom: 6px;
      }
      
      .invoice-title {
        font-size: 24px;
        font-weight: 700;
        margin: 32px 0 24px;
        color: #0557B5;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        padding-bottom: 12px;
      }
      
      .invoice-title:after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 60px;
        height: 4px;
        background-color: #0557B5;
        border-radius: 2px;
      }
      
      .invoice-info {
        display: flex;
        justify-content: space-between;
        margin: 32px 0;
        background-color: #F8FAFC;
        border-radius: 8px;
        padding: 24px;
      }
      
      .invoice-to, .invoice-details {
        font-size: 14px;
      }
      
      .invoice-to p, .invoice-details p {
        margin: 8px 0;
        color: #64748B;
      }
      
      .invoice-to strong, .invoice-details strong {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: #1E293B;
        margin-bottom: 10px;
      }
      
      .info-highlight {
        color: #1E293B;
        font-weight: 500;
      }
      
      .status-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        background-color: ${order.status === 'approved' ? '#E6F9F4' : order.status === 'pending' ? '#FFF5E6' : order.status === 'processing' ? '#E1EFFF' : '#FFECEE'};
        color: ${order.status === 'approved' ? '#00B884' : order.status === 'pending' ? '#FF9D00' : order.status === 'processing' ? '#0557B5' : '#FF4757'};
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 32px 0;
      }
      
      .items-table th {
        background-color: #F1F5F9;
        color: #1E293B;
        font-weight: 600;
        text-align: left;
        padding: 14px;
        border-radius: 6px 6px 0 0;
      }
      
      .items-table td {
        padding: 14px;
        border-bottom: 1px solid #E2E8F0;
      }
      
      .items-table tr:last-child td {
        border-bottom: none;
      }
      
      .summary {
        margin-top: 32px;
        margin-left: auto;
        width: 35%;
      }
      
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #E2E8F0;
      }
      
      .summary-row:last-child {
        border-bottom: none;
        padding-top: 16px;
      }
      
      .summary-label {
        font-weight: 500;
      }
      
      .total {
        font-size: 18px;
        font-weight: 700;
        color: #0557B5;
      }
      
      .notes {
        margin-top: 40px;
        padding: 24px;
        background-color: #F8FAFC;
        border-radius: 8px;
        font-size: 14px;
        color: #64748B;
      }
      
      .notes h3 {
        color: #1E293B;
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 600;
      }
      
      .payment-instructions {
        margin-top: 32px;
        padding: 24px;
        background-color: #E1EFFF;
        border-radius: 8px;
        font-size: 14px;
      }
      
      .payment-instructions h3 {
        color: #0557B5;
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 600;
      }
      
      .footer {
        margin-top: 48px;
        text-align: center;
        font-size: 14px;
        color: #64748B;
        border-top: 1px solid #E2E8F0;
        padding-top: 32px;
      }
      
      .footer-logo {
        font-size: 20px;
        font-weight: 700;
        color: #0557B5;
        margin-bottom: 12px;
      }
      
      .footer p {
        margin: 6px 0;
      }
      
      .thank-you {
        font-size: 18px;
        font-weight: 600;
        color: #0557B5;
        margin-bottom: 16px;
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="logo-container">
          <div class="logo">TEFA APPS</div>
          <div class="tagline">Teaching Factory Application</div>
        </div>
        <div class="company-details">
          <div class="company-name">TEFA ORGANIZATION</div>
          <p>Jln. Raya Pebayuran, Kab Bekasi<br>
          Jawa Barat, Indonesia<br>
          haris.febriyan.stmik@krw.horizon.ac.id<br>
          +62 815 7462 3974</p>
        </div>
      </div>
      
      <h1 class="invoice-title">INVOICE #${order.orderNumber}</h1>
      
      <div class="invoice-info">
        <div class="invoice-to">
          <strong>Tagihan Untuk:</strong>
          <p>${order.customerName || 'N/A'}</p>
          <p>${order.customerEmail || 'N/A'}</p>
        </div>
        <div class="invoice-details">
          <strong>Detail Invoice:</strong>
          <p><span>Nomor Invoice:</span> <span class="info-highlight">${order.orderNumber}</span></p>
          <p><span>Tanggal Invoice:</span> <span class="info-highlight">${invoiceDate}</span></p>
          <p><span>Tanggal Pesanan:</span> <span class="info-highlight">${orderDate}</span></p>
          <p><span>Jatuh Tempo:</span> <span class="info-highlight">${dueDate}</span></p>
          <p><span>Status:</span> <span class="status-badge">${ORDER_STATUS[order.status]?.label || 'N/A'}</span></p>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 60%">Deskripsi</th>
            <th style="width: 15%">Jumlah</th>
            <th style="width: 25%">Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight: 600;">${order.productName || 'Produk/Layanan'}</div>
              <div style="color: #64748B; font-size: 14px; margin-top: 4px;">${order.notes || 'Pesanan TEFA'}</div>
            </td>
            <td>1</td>
            <td>Rp ${order.amount?.toLocaleString('id-ID') || '0'}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <span class="summary-label">Subtotal:</span>
          <span>Rp ${order.amount?.toLocaleString('id-ID') || '0'}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Pajak (0%):</span>
          <span>Rp 0</span>
        </div>
        <div class="summary-row">
          <span class="summary-label total">Total:</span>
          <span class="total">Rp ${order.amount?.toLocaleString('id-ID') || '0'}</span>
        </div>
      </div>
      
      <div class="payment-instructions">
        <h3>Instruksi Pembayaran</h3>
        <p>Silakan lakukan pembayaran ke rekening berikut:</p>
        <p><strong>Bank:</strong> ${order.paymentMethod || 'Bank BCA'}</p>
        <p><strong>Nomor Rekening:</strong> ${order.paymentAccountNumber || '123456789'}</p>
        <p><strong>Atas Nama:</strong> ${order.paymentAccountHolder || 'TEFA Organization'}</p>
        <p>Cantumkan nomor invoice <strong>#${order.orderNumber}</strong> pada keterangan transfer</p>
      </div>
      
      <div class="notes">
        <h3>Catatan</h3>
        <p>${order.notes || 'Tidak ada catatan tambahan untuk pesanan ini.'}</p>
      </div>
      
      <div class="footer">
        <div class="thank-you">Terima Kasih Atas Kepercayaan Anda</div>
        <div class="footer-logo">TEFA APPS</div>
        <p>Jika ada pertanyaan tentang invoice ini, silakan hubungi kami:</p>
        <p>haris.febriyan.stmik@krw.horizon.ac.id | +62 815 7462 3974</p>
        <p>© ${new Date().getFullYear()} TEFA Organization. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

  // Handle invoice download
  const handleDownloadInvoice = async () => {
    if (!order) return;
    
    try {
      setGeneratingInvoice(true);
      
      // Generate HTML for the invoice
      const htmlContent = generateInvoiceHtml(order);
      
      // Create a PDF from the HTML
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      // Generate a better filename
      const invoiceFileName = `Invoice_${order.orderNumber || order.id}_${moment().format('YYYYMMDD')}.pdf`;
      const invoiceFilePath = `${FileSystem.documentDirectory}${invoiceFileName}`;
      
      // Copy the file to a location with a better name
      await FileSystem.copyAsync({
        from: uri,
        to: invoiceFilePath
      });
      
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(invoiceFilePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Invoice',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on your device');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengunduh invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Handle WhatsApp contact
  const handleWhatsAppContact = () => {
    const orderNumber = order.orderNumber || order.id || '12345';
    const contactNumber = order.contactNumber || '+6281574623974';
    const whatsappURL = `https://wa.me/${contactNumber}?text=Saya%20mau%20konfirmasi%20kendala%20pesanan%20saya%20Kak%2C%20Order%20Number%3A%20${orderNumber}`;
    router.push(whatsappURL);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat detail pesanan...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Circle size={48} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Pesanan tidak ditemukan</Text>
        <Text style={styles.errorText}>Maaf, pesanan yang Anda cari tidak tersedia</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const StatusIcon = status.icon;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft color={COLORS.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animatable.View 
          animation="fadeInDown" 
          style={[styles.statusCard, { backgroundColor: status.bgColor }]}
        >
          <StatusIcon size={24} color={status.color} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            <Text style={styles.statusDescription}>{status.description}</Text>
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={200}>
          {/* Order Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Package size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}> Nama Produk</Text>
                <Text style={styles.infoValue}>{order.productName || '(Tidak tersedia)'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Package size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nomor Pesanan</Text>
                <Text style={styles.infoValue}>{order.orderNumber || '(Tidak tersedia)'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tanggal Pesanan</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Deadline</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.deadline)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <DollarSign size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Pembayaran</Text>
                <Text style={styles.infoValue}>Rp {order.amount?.toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Pelanggan</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <User size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nama</Text>
                <Text style={styles.infoValue}>{order.customerName || '(Tidak tersedia)'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{order.customerEmail || '(Tidak tersedia)'}</Text>
              </View>
            </View>
          </View>
         
          {/* Payment Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Pembayaran</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <CreditCard size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Metode Pembayaran</Text>
                <Text style={styles.infoValue}>{order.paymentMethod || '(Tidak tersedia)'}</Text>
              </View>
            </View>

            {order.paymentAccountNumber && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <CreditCard size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nomor Rekening</Text>
                  <Text style={styles.infoValue}>{order.paymentAccountNumber}</Text>
                </View>
              </View>
            )}

            {order.paymentAccountHolder && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <User size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Atas Nama</Text>
                  <Text style={styles.infoValue}>{order.paymentAccountHolder}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Invoice Information - Only show when status is approved */}
         
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informasi Invoice</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FileText size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nomor Invoice</Text>
                  <Text style={styles.infoValue}>{order.orderNumber || order.id}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Calendar size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tanggal Invoice</Text>
                  <Text style={styles.infoValue}>{moment().format('DD MMMM YYYY')}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={handleDownloadInvoice}
                disabled={generatingInvoice}
              >
                {generatingInvoice ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Download size={20} color={COLORS.white} />
                    <Text style={styles.downloadButtonText}>Download Invoice</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catatan Pesanan</Text>
            <Text style={styles.notes}>
              {order.notes || 'Tidak ada catatan untuk pesanan ini'}
            </Text>
          </View>
        </Animatable.View>
      </ScrollView>

      <Animatable.View animation="fadeInUp" style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: COLORS.primaryLight }]}
          onPress={handleWhatsAppContact}
        >
          <MessageSquare size={20} color={COLORS.primary} />
          <Text style={[styles.footerButtonText, { color: COLORS.primary }]}>
            Hubungi Admin
          </Text>
        </TouchableOpacity>

      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: COLORS.headerBlue,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralDark,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  footerButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});