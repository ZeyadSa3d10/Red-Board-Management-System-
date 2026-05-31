export const calcProfitMargin = (salePrice, costPrice) =>
  costPrice > 0 ? ((salePrice - costPrice) / costPrice * 100).toFixed(1) : 0;

export const calcInvoiceTotal = (items, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * (item.unitPrice || 0)), 0);
  return { subtotal, discount, total: subtotal - discount };
};

export const calcWeightedAvgCost = (existingQty, existingCost, newQty, newCost) => {
  const totalQty = existingQty + newQty;
  return totalQty > 0 ? ((existingQty * existingCost) + (newQty * newCost)) / totalQty : newCost;
};


