/**
 * Chuẩn hóa email Gmail:
 * - Lowercase toàn bộ
 * - Với Gmail: bỏ dấu chấm (.) trong phần local-part và bỏ phần sau dấu cộng (+)
 * Ví dụ: "Test.User+123@gmail.com" → "testuser@gmail.com"
 */
const normalizeEmail = (email) => {
  if (!email) return email;

  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split('@');

  if (!domain) return lower;

  // Chỉ áp dụng normalize cho Gmail
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const withoutPlus = local.split('+')[0];
    const withoutDots = withoutPlus.replace(/\./g, '');
    return `${withoutDots}@gmail.com`;
  }

  return lower;
};

module.exports = normalizeEmail;