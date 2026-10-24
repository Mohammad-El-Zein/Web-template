// Fehlercodes vom Backend (HTTP 400 { code, message, ... }) in übersetzte Meldungen umwandeln
export const ORDER_ERROR_CODES = ["RESTAURANT_CLOSED", "MIN_ORDER_NOT_REACHED", "DELIVERY_DISABLED", "PICKUP_DISABLED"];

export const orderErrorCode = (error) => {
  const code = error?.response?.data?.code;
  return ORDER_ERROR_CODES.includes(code) ? code : "";
};

export const orderErrorMessage = (error, t) => {
  if (!error?.response) return t("orderErrors.network");
  const code = orderErrorCode(error);
  if (code === "MIN_ORDER_NOT_REACHED") {
    const amount = Number(error.response.data.minOrderAmount) || 0;
    return t("orderErrors.MIN_ORDER_NOT_REACHED", { amount: `${amount.toFixed(2)} €` });
  }
  return code ? t(`orderErrors.${code}`) : t("orderErrors.generic");
};
