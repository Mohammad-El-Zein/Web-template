import React, { useContext, useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../service/authService";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { setToken, loadCartData } = useContext(StoreContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Backend erwartet email + password → NICHT emailNew!
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const response = await login(data);

      if (response.status === 200) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);

        await loadCartData(response.data.token);

        navigate("/");
        toast.success(t("loginNew.successNew"));
      } else {
        toast.error(t("loginNew.failedNew"));
      }
    } catch (error) {
      console.log("Login error:", error);
      toast.error(t("loginNew.failedNew"));
    }
  };

  return (
    <main className="fx-page fx-auth">
      <div className="fx-card fx-auth-card">
        <span className="fx-tag">{t("pages.accountTag")}</span>
        <h1 className="fx-h2">{t("loginNew.titleNew")}</h1>

        <form onSubmit={onSubmitHandler} className="fx-auth-form">
          <div className="fx-field">
            <label htmlFor="login-email">{t("loginNew.emailNew")}</label>
            <input
              type="email"
              className="form-control"
              id="login-email"
              placeholder="name@example.com"
              name="email"
              autoComplete="email"
              onChange={onChangeHandler}
              value={data.email}
              required
            />
          </div>

          <div className="fx-field">
            <label htmlFor="login-password">{t("loginNew.passwordNew")}</label>
            <input
              type="password"
              className="form-control"
              id="login-password"
              name="password"
              autoComplete="current-password"
              onChange={onChangeHandler}
              value={data.password}
              required
            />
          </div>

          <button className="fx-btn fx-btn-primary fx-btn-block" type="submit">
            {t("loginNew.loginBtnNew")}
          </button>
          <button
            className="fx-text-btn fx-auth-reset"
            type="reset"
            onClick={() => setData({ email: "", password: "" })}
          >
            {t("loginNew.resetBtnNew")}
          </button>
        </form>

        <p className="fx-auth-switch">
          {t("loginNew.noAccountNew")}{" "}
          <Link to="/register">{t("loginNew.registerNew")}</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
