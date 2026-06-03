import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Hiện tại chỉ hỗ trợ tiếng Việt
  // Khi cần đa ngôn ngữ: đọc locale từ cookie/header/URL
  const locale = 'vi';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
