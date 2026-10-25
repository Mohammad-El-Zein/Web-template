import React, { useState } from "react";
import "../Login/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerUser } from "../../service/authService";
import { useTranslation } from "react-i18next";

const EMPTY = { name: "", email: "", password: "" };

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState(EMPTY);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const response = await registerUser(data);
      if (response.status === 201) {
        toast.success(t("messages.registerSuccess"));
        navigate("/login");
      } else {
        toast.error(t("messages.registerFailed"));
      }
    } catch {
      toast.error(t("messages.registerFailed"));
    }
  };

  return (
    <main className="fx-page fx-auth">
      <div className="fx-card fx-auth-card">
        <span className="fx-tag">{t("pages.accountTag")}</span>
        <h1 className="fx-h2">{t("auth.registerTitle")}</h1>

        <form onSubmit={onSubmitHandler} className="fx-auth-form">
          <div className="fx-field">
            <label htmlFor="register-name">{t("auth.name")}</label>
            <input
              type="text"
              className="form-control"
              id="register-name"
              name="name"
              autoComplete="name"
              onChange={onChangeHandler}
              value={data.name}
              required
            />
          </div>

          <div className="fx-field">
            <label htmlFor="register-email">{t("auth.email")}</label>
            <input
              type="email"
              className="form-control"
              id="register-email"
              name="email"
              autoComplete="email"
              onChange={onChangeHandler}
              value={data.email}
              required
            />
          </div>

          <div className="fx-field">
            <label htmlFor="register-password">{t("auth.password")}</label>
            <input
              type="password"
              className="form-control"
              id="register-password"
              name="password"
              autoComplete="new-password"
              onChange={onChangeHandler}
              value={data.password}
              required
            />
          </div>

          <button className="fx-btn fx-btn-primary fx-btn-block" type="submit">
            {t("auth.registerSubmit")}
          </button>
          <button className="fx-text-btn fx-auth-reset" type="reset" onClick={() => setData(EMPTY)}>
            {t("auth.reset")}
          </button>
        </form>

        <p className="fx-auth-switch">
          {t("auth.alreadyAccount")}{" "}
          <Link to="/login">{t("auth.loginLink")}</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
