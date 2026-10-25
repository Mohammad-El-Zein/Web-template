import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { analyzeNutrition } from "../../service/NutritionService";

// Kalorien mit KI schätzen: Link -> Dialog (Portionsgröße) -> Ergebnis. Gleich in Karte und Gerichtseite.
const AiNutrition = ({ name }) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [portion, setPortion] = useState(300);
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState(null);

  // Escape schließt den Dialog (nicht während der Anfrage)
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !loading && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading]);

  const estimate = async () => {
    if (!name) {
      toast.error(t("messages.foodNotLoaded"));
      return;
    }
    setLoading(true);
    try {
      setNutrition(await analyzeNutrition(name, portion));
      setOpen(false);
    } catch (e) {
      toast.error(t(e.response?.status === 429 ? "messages.aiLimitReached" : "messages.aiEstimateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {nutrition ? (
        <div className="fx-nutrition">
          <p className="fx-label">{t("foodDetails.estimatedWithAI")}</p>
          <span>{t("foodDetails.calories")}</span><strong>{nutrition.calories} kcal</strong>
          <span>{t("foodDetails.protein")}</span><strong>{nutrition.protein} g</strong>
          <span>{t("foodDetails.carbs")}</span><strong>{nutrition.carbs} g</strong>
          <span>{t("foodDetails.fat")}</span><strong>{nutrition.fat} g</strong>
          <span>{t("foodDetails.portion")}</span><strong>{portion} {t("modals.grams")}</strong>
        </div>
      ) : (
        <button type="button" className="fx-text-btn fx-ai-link" onClick={() => setOpen(true)}>
          <i className="bi bi-stars" aria-hidden="true"></i>
          {t("foodDetails.aiEstimate")}
        </button>
      )}

      {open && createPortal(
        <div className="fx-modal-overlay" onClick={() => !loading && setOpen(false)}>
          <div className="fx-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
            <h2 className="fx-h3" id={titleId}>{t("modals.aiEstimateTitle")}</h2>
            <p>{t("modals.aiEstimateDesc")}</p>
            <div className="fx-modal-input">
              <input
                type="number"
                min="1"
                className="form-control"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                aria-label={t("foodDetails.portion")}
                autoFocus
              />
              <span>{t("modals.grams")}</span>
            </div>
            <div className="fx-modal-actions">
              <button type="button" className="fx-btn fx-btn-primary" onClick={estimate} disabled={loading}>
                {loading ? t("general.loading") : t("modals.estimate")}
              </button>
              <button type="button" className="fx-btn fx-btn-outline" onClick={() => setOpen(false)} disabled={loading}>
                {t("buttons.cancel")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AiNutrition;
