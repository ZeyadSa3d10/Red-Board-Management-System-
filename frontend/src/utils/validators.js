export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} مطلوب`;
  }
  return null;
};

export const validateMinPrice = (price, minPrice, productName) => {
  if (price < minPrice) {
    return `سعر ${productName} أقل من الحد المسموح (${minPrice})`;
  }
  return null;
};

export const validateStock = (qty, available, productName) => {
  if (qty > available) {
    return `الكمية المطلوبة من ${productName} تتجاوز المخزون المتاح (${available})`;
  }
  return null;
};

export const validatePhone = (phone) => {
  const re = /^01[0-9]{9}$/;
  if (!re.test(phone)) {
    return 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)';
  }
  return null;
};

export const validatePositiveNumber = (value, fieldName) => {
  if (!value || value <= 0) {
    return `${fieldName} يجب أن يكون أكبر من صفر`;
  }
  return null;
};
