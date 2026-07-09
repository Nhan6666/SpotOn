// ============================================================
// VNPAY SANDBOX SERVICE — UC-C12: Tích hợp cổng thanh toán VNPay
// Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
// ============================================================
const crypto = require('crypto');
const querystring = require('qs');

class VNPayService {
  constructor() {
    this.vnp_TmnCode = process.env.VNPAY_TMN_CODE || 'SPOTON01';
    this.vnp_HashSecret = process.env.VNPAY_HASH_SECRET || 'SPOTONHASHSECRETKEY2026';
    this.vnp_Url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/v1/payment/vnpay-return';
    this.vnp_IpnUrl = process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/v1/payment/vnpay-ipn';
  }

  _sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  /**
   * Tạo URL thanh toán VNPay
   * @param {Object} params
   * @param {string} params.bookingId - Mã đơn đặt bàn (dùng làm vnp_TxnRef)
   * @param {number} params.amount - Số tiền cọc (VNĐ, không nhân 100)
   * @param {string} params.orderInfo - Mô tả đơn hàng
   * @param {string} params.ipAddr - IP của khách hàng
   * @returns {string} URL redirect đến VNPay
   */
  createPaymentUrl({ bookingId, amount, orderInfo, ipAddr }) {
    const date = new Date();
    const createDate = this._formatDate(date);

    // VNPay yêu cầu vnp_TxnRef unique → Dùng bookingId + timestamp
    const txnRef = `${bookingId}_${Date.now()}`;

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo || `Coc dat ban SpotOn #${bookingId}`,
      vnp_OrderType: 'food',
      vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    vnp_Params = this._sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = `${this.vnp_Url}?${querystring.stringify(vnp_Params, { encode: false })}`;
    return { paymentUrl, txnRef };
  }

  /**
   * Xác thực chữ ký từ VNPay IPN/Return
   * @param {Object} vnpParams - Query params từ VNPay callback
   * @returns {{ isValid: boolean, responseCode: string }}
   */
  verifyReturnUrl(vnpParams) {
    const secureHash = vnpParams['vnp_SecureHash'];

    // Loại bỏ các trường hash trước khi verify
    const params = { ...vnpParams };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sortedParams = this._sortObject(params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return {
      isValid: secureHash === checkSum,
      responseCode: vnpParams['vnp_ResponseCode'], // '00' = Thành công
      transactionId: vnpParams['vnp_TransactionNo'],
      txnRef: vnpParams['vnp_TxnRef'],
      amount: parseInt(vnpParams['vnp_Amount']) / 100, // Chia 100 lại
    };
  }

  /**
   * Format ngày theo chuẩn VNPay: yyyyMMddHHmmss
   */
  _formatDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }
}

module.exports = new VNPayService();
