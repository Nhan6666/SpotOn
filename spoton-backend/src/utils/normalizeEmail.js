const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';

  // Chuyển hết về chữ thường và xóa khoảng trắng thừa
  let cleanEmail = email.toLowerCase().trim();

  // Tách phần tên (local) và phần miền (domain)
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) return cleanEmail;

  let localPart = parts[0];
  const domain = parts[1];

  // Xử lý dấu "+" (Alias email): Bỏ hết mọi thứ sau dấu "+"
  if (localPart.includes('+')) {
    localPart = localPart.split('+')[0];
  }

  // Xử lý dấu "." (Chỉ áp dụng cho Gmail/Google Workspace)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    localPart = localPart.replace(/\./g, ''); // Xóa toàn bộ dấu chấm
  }

  return `${localPart}@${domain}`;
};

module.exports = normalizeEmail;