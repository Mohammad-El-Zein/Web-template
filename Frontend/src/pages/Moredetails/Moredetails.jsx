import React from "react";
import { useNavigate } from "react-router-dom";
import "./Moredetails.css";
import { useTranslation, Trans } from "react-i18next";

const Moredetails = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="moredetails-page min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <button
        className="back-btn mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => navigate("/")}
        aria-label={t("moreDetails.backAria")}
      >
        ← {t("moreDetails.back")}
      </button>

      <div className="max-w-3xl bg-white shadow-lg rounded-2xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          {t("moreDetails.title")}
        </h1>

        <p className="text-gray-700 mb-4">
          <Trans i18nKey="moreDetails.p1" components={{ strong: <strong /> }} />
        </p>

        <p className="text-gray-700 mb-4">
          <Trans i18nKey="moreDetails.p2" components={{ strong: <strong /> }} />
        </p>

        <p className="text-gray-700 mb-4">
          <Trans i18nKey="moreDetails.p3" components={{ strong: <strong /> }} />
        </p>

        <p className="text-gray-700 mb-4">
          <Trans i18nKey="moreDetails.p4" components={{ strong: <strong /> }} />
        </p>

        <p className="text-gray-700 mb-4">
          <Trans i18nKey="moreDetails.p5" components={{ strong: <strong /> }} />
        </p>

        <p className="text-gray-700 mb-4">
          <Trans i18nKey="moreDetails.p6" components={{ strong: <strong /> }} />
        </p>

        <p className="text-gray-700">
          <Trans i18nKey="moreDetails.p7" components={{ strong: <strong /> }} />
        </p>
      </div>
    </div>
  );
};

export default Moredetails;
