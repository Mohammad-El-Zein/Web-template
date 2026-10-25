import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StoreContext } from "../../context/StoreContext";
import { useRestaurant } from "../../util/useRestaurant";
import { useScrolled } from "../../util/useScrolled";
import Logo from "../Logo/Logo";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import "./Menubar.css";

// Menüleiste: auf der Startseite transparent über dem Foto, sonst (und nach dem Scrollen) fest mit hellem Hintergrund
const Menubar = () => {
  const { t } = useTranslation();
  const { name, hasAbout } = useRestaurant();
  const { quantities, token, setToken, setQuantities } = useContext(StoreContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const cartCount = Object.values(quantities || {}).filter((qty) => qty > 0).length;
  const onPhoto = pathname === "/" && !scrolled && !open;
  const links = [
    { to: "/explore", label: t("navbar.menu") },
    hasAbout && { to: "/about", label: t("navbar.about") },
    { to: "/contact", label: t("navbar.contact") },
  ].filter(Boolean);
  const accountLinks = token
    ? [{ to: "/myorders", label: t("navbar.myOrders") }]
    : [{ to: "/login", label: t("navbar.login") }, { to: "/register", label: t("navbar.register") }];

  // Konto-Menü schließen bei Klick außerhalb oder Escape
  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setAccountOpen(false);
      setOpen(false);
    };
    // Beim Wechsel auf Desktop-Breite das Handy-Menü schließen
    const desktop = window.matchMedia("(min-width: 901px)");
    const onDesktop = () => desktop.matches && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setAccountOpen(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setQuantities({});
    close();
    navigate("/");
  };

  return (
    <header className={`fx-nav ${onPhoto ? "on-photo" : "is-solid"} ${open ? "is-open" : ""}`}>
      <div className="fx-nav-inner">
        <Link to="/" className="fx-nav-brand" onClick={close} aria-label={name}>
          <Logo />
        </Link>

        <nav className="fx-nav-links" aria-label={t("navbar.menuLabel")}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="fx-nav-link" onClick={close}>{link.label}</NavLink>
          ))}
        </nav>

        <div className="fx-nav-end">
          <LanguageSwitcher />

          <div className="fx-account" ref={accountRef}>
            <button
              type="button"
              className="fx-nav-icon"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-label={t("navbar.account")}
              onClick={() => setAccountOpen((o) => !o)}
            >
              <i className="bi bi-person" aria-hidden="true"></i>
            </button>
            {accountOpen && (
              <ul className="fx-menu" role="menu">
                {accountLinks.map((link) => (
                  <li key={link.to} role="none">
                    <Link role="menuitem" to={link.to} onClick={close}>{link.label}</Link>
                  </li>
                ))}
                {token && (
                  <li role="none">
                    <button type="button" role="menuitem" onClick={logout}>{t("navbar.logout")}</button>
                  </li>
                )}
              </ul>
            )}
          </div>

          <Link to="/cart" className="fx-nav-icon fx-nav-cart" onClick={close} aria-label={`${t("navbar.cart")} (${cartCount})`}>
            <i className="bi bi-bag" aria-hidden="true"></i>
            {cartCount > 0 && <span className="fx-nav-badge">{cartCount}</span>}
          </Link>

          <Link to="/explore" className="fx-btn fx-btn-outline fx-btn-small fx-nav-cta" onClick={close}>
            {t("navbar.order")}
          </Link>

          <button
            type="button"
            className="fx-nav-toggle"
            aria-expanded={open}
            aria-controls="fx-nav-panel"
            aria-label={open ? t("navbar.closeMenu") : t("navbar.openMenu")}
            onClick={() => setOpen((o) => !o)}
          >
            <span></span><span></span>
          </button>
        </div>
      </div>

      {/* Aufgeklapptes Menü auf dem Handy */}
      <div id="fx-nav-panel" className="fx-nav-panel" hidden={!open}>
        <nav aria-label={t("navbar.menuLabel")}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={close}>{link.label}</NavLink>
          ))}
        </nav>
        <div className="fx-nav-panel-account">
          {accountLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={close}>{link.label}</Link>
          ))}
          {token && <button type="button" onClick={logout}>{t("navbar.logout")}</button>}
        </div>
      </div>
    </header>
  );
};

export default Menubar;
