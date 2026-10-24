import { useSettings } from "../../context/settingsContext";

// Kann gerade bestellt werden? reason: "closed" (außerhalb der Öffnungszeiten) oder "noOrderTypes"
export const useOrderAvailability = () => {
  const { settings, canOrderNow } = useSettings();
  const { deliveryEnabled, pickupEnabled } = settings.ordering;
  if (!deliveryEnabled && !pickupEnabled) return { blocked: true, reason: "noOrderTypes" };
  if (!canOrderNow) return { blocked: true, reason: "closed" };
  return { blocked: false, reason: "" };
};
