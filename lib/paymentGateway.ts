// Helper untuk Base64 encoding (gantikan btoa jika tidak tersedia)
const btoa = (str: string) => Buffer.from(str).toString('base64');

const API_KEY = 'xnd_development_YOUR_API_KEY'; // Ganti dengan API key Xendit Anda
const XENDIT_API_URL = 'https://api.xendit.co';

interface PaymentResponse {
  id: string;
  status: string;
  paymentUrl?: string;
  qrCode?: string;
  accountNumber?: string;
  instructions?: string[];
}

export const createPayment = async (paymentData: {
  orderId: string;
  amount: number;
  paymentMethod: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<PaymentResponse> => {
  try {
    let endpoint = '';
    let payload: any = {};

    switch (paymentData.paymentMethod) {
      case 'qris':
        endpoint = '/qr_codes';
        payload = {
          external_id: paymentData.orderId,
          type: 'DYNAMIC',
          callback_url: 'https://your-callback-url.com', // Ganti dengan callback URL Anda
          amount: paymentData.amount,
        };
        break;

      case 'bank_transfer':
        endpoint = '/v2/invoices';
        payload = {
          external_id: paymentData.orderId,
          amount: paymentData.amount,
          payer_email: paymentData.customerEmail,
          description: `Payment for order ${paymentData.orderId}`,
          success_redirect_url: 'https://your-success-url.com',
          failure_redirect_url: 'https://your-failure-url.com',
        };
        break;

      case 'dana':
      case 'gopay':
        endpoint = '/ewallets/charges';
        payload = {
          reference_id: paymentData.orderId,
          currency: 'IDR',
          amount: paymentData.amount,
          checkout_method: 'ONE_TIME_PAYMENT',
          channel_code: paymentData.paymentMethod.toUpperCase(),
          channel_properties: {
            success_redirect_url: 'https://your-success-url.com',
          },
        };
        break;

      default:
        throw new Error('Unsupported payment method');
    }

    const response = await fetch(`${XENDIT_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment creation failed');
    }

    const data = await response.json();

    return {
      id: data.id,
      status: data.status || 'pending',
      paymentUrl: data.invoice_url || data.checkout_url,
      qrCode: data.qr_string,
      accountNumber: data.account_number,
      instructions: data.instructions,
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const checkPaymentStatus = async (paymentId: string): Promise<{ status: string }> => {
  try {
    const response = await fetch(`${XENDIT_API_URL}/v2/invoices/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    const data = await response.json();
    return { status: data.status.toLowerCase() };
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
};