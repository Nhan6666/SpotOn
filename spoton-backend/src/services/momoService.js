// ============================================================
// MOMO SANDBOX SERVICE — UC-C12: Tích hợp cổng thanh toán MoMo
// Docs: https://developers.momo.vn/v3/docs/payment/api/payment-api/create
// ============================================================
const crypto = require('crypto');

class MoMoService {
  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    this.accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
    this.secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    this.endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    this.redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/booking/payment-result';
    this.ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/v1/payment/momo-ipn';
  }

  /**
   * Tạo URL thanh toán MoMo
   * @param {Object} params
   * @param {string} params.bookingId - Mã đơn đặt bàn
   * @param {number} params.amount - Số tiền cọc (VNĐ)
   * @param {string} params.orderInfo - Mô tả đơn hàng
   * @returns {Promise<{ paymentUrl: string, orderId: string }>}
   */
  async createPaymentUrl({ bookingId, amount, orderInfo }) {
    const orderId = `SPOTON_${bookingId}_${Date.now()}`;
    const requestId = orderId;
    const extraData = Buffer.from(JSON.stringify({ bookingId })).toString('base64');

    // Tạo chữ ký HMAC_SHA256 theo spec MoMo
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${this.ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo || `Coc dat ban SpotOn #${bookingId}`}`,
      `partnerCode=${this.partnerCode}`,
      `redirectUrl=${this.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=payWithMethod`,
    ].join('&');

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'SpotOn Restaurant',
      storeId: 'SpotOnStore',
      requestId,
      amount,
      orderId,
      orderInfo: orderInfo || `Coc dat ban SpotOn #${bookingId}`,
      redirectUrl: this.redirectUrl,
      ipnUrl: this.ipnUrl,
      lang: 'vi',
      requestType: 'payWithMethod',
      autoCapture: true,
      extraData,
      signature,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.resultCode === 0) {
        return {
          paymentUrl: data.payUrl,
          orderId,
          requestId,
        };
      } else {
        throw new Error(`MoMo Error: ${data.message} (Code: ${data.resultCode})`);
      }
    } catch (error) {
      console.error('MoMo createPaymentUrl error:', error);
      throw error;
    }
  }

  /**
   * Xác thực chữ ký IPN từ MoMo
   * @param {Object} ipnData - Body từ MoMo IPN callback
   * @returns {{ isValid: boolean, resultCode: number }}
   */
  verifyIPN(ipnData) {
    const {
      accessKey, amount, extraData, message, orderId,
      orderInfo, orderType, partnerCode, payType,
      requestId, responseTime, resultCode, transId,
    } = ipnData;

    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `message=${message}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join('&');

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    return {
      isValid: expectedSignature === ipnData.signature,
      resultCode: parseInt(resultCode),
      transactionId: String(transId),
      orderId,
      amount: parseInt(amount),
      extraData,
    };
  }
}

module.exports = new MoMoService();
