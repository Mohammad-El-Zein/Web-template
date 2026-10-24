# 🍔 FlavorHaus – Full-Stack Food Delivery App

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe"/>
</p>

<p align="center">
  <strong>Eine moderne Full-Stack Restaurant-Webanwendung mit Online-Bestellung, sicherer Zahlung und KI-gestützter Kalorienberechnung.</strong>
</p>

<p align="center">
  • <a href="https://flavorhaus.elzein.dev/">🌐 Live Demo</a> •

</p>

---

## 📋 Über das Projekt

**FlavorHaus** ist eine vollständige Online-Bestellplattform, die es Nutzern ermöglicht, Gerichte zu entdecken, Bestellungen aufzugeben und sicher online zu bezahlen. Das Projekt kombiniert moderne Technologien zu einem produktionsfähigen System, das reale Anforderungen aus dem Bereich Food Delivery abdeckt.

### 🎯 Projektziele

- ✅ Vollständig produktionsfähige Anwendung
- ✅ Moderne Technologien und Best Practices
- ✅ Reale Problemlösungen (Authentifizierung, Zahlung, Bestellverwaltung)
- ✅ Referenzprojekt für professionelle Bewerbungen

---

## ✨ Features

### 🖥️ Frontend
| Feature | Beschreibung |
|---------|-------------|
| 🌍 Mehrsprachigkeit | Deutsch, Englisch & Arabisch (inkl. Rechts-nach-links-Layout) |
| 🔐 Authentifizierung | JWT-basierte Benutzer-Registrierung und Login |
| 🍽️ Menüübersicht | Alle Gerichte mit Details und Bildern |
| 🛒 Warenkorb | Vollständiges Warenkorb-System |
| 💳 Checkout | Echtzeit-Validierung und Stripe-Integration |
| 📱 Responsive | Optimiert für alle Geräte |
| 🤖 KI-Kalorien | Intelligente Kalorienberechnung basierend auf Portionsgrößen |

### ⚙️ Backend
| Feature | Beschreibung |
|---------|-------------|
| 🔌 REST API | Spring Boot REST API mit sauberer Architektur |
| 🗄️ Datenbank | MongoDB Atlas als NoSQL-Datenbank |
| 🔒 Security | JWT-Authentication + BCrypt Passwort-Hashing |
| 💰 Payments | Stripe-Integration für sichere Zahlungen |
| 🛡️ CORS | Sorgfältig konfiguriert für Netlify + lokale Entwicklung |

### 👨‍💼 Admin Panel
| Feature | Beschreibung |
|---------|-------------|
| 📊 Dashboard | Umsatz, Bestellungen, Umsatz-Diagramm und beliebteste Gerichte |
| 🍕 Gerichte verwalten | Hinzufügen, Bearbeiten, Löschen – in 3 Sprachen mit KI-Übersetzung |
| 📦 Bestellstatus | Bestellungen filtern, durchsuchen und Status aktualisieren |
| 👤 Profil | Kontodaten ansehen, Name und Passwort ändern |
| 🔐 Admin-Login | Zugriff nur für Admin-Konten (JWT + Rolle) |

---

## 🛠️ Tech Stack

### Frontend
```
React (Vite)  •  React Router  •  Context API  •  Axios  •  i18next  •  CSS/Bootstrap
```

### Backend
```
Java 17  •  Spring Boot  •  Spring Security + JWT  •  MongoDB Atlas  •  Stripe Java SDK
```

### Deployment
```
Frontend + Admin: Netlify  •  Backend: Railway  •  Database: MongoDB Atlas
```

---

## 📁 Projektstruktur

```
Food-delivery-web/
├── Frontend/          # React Client-Anwendung
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── services/
│   └── package.json
│
├── Backend/           # Spring Boot REST API
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   └── pom.xml
│
├── Admin/             # Admin Dashboard
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── package.json
│
└── README.md
```

---

## 🔗 Live Demo

| Service | Link |
|---------|------|
| 🌐 **Frontend** | [flavorhaus.elzein.dev](https://flavorhaus.elzein.dev/) |
| 👨‍💼 **Admin Panel** | [flavorhaus-admin.elzein.dev](https://flavorhaus-admin.elzein.dev/) (nur mit Admin-Login) |
| 🔌 **Backend API** | [flavorhaus-mo.up.railway.app](https://flavorhaus-mo.up.railway.app) |

---

## 💳 Zahlungen mit Stripe

Die App nutzt **Stripe Checkout** für sichere Zahlungen:

1. Nutzer erstellt Bestellung
2. Backend generiert Stripe-Session
3. Weiterleitung zu Stripe
4. Nach Zahlung:
   - ✅ Erfolg → `/payment/success/:orderId`
   - ❌ Fehler → `/payment/fail/:orderId`

**Testkarte:** `4242 4242 4242 4242` (beliebiges Datum in der Zukunft, beliebige CVC)

---

## 🚀 Roadmap

- [ ] Bewertungssystem für Gerichte
- [ ] Echtzeit-Benachrichtigungen (WebSocket)
- [ ] Erweiterte Admin-Analytics
- [ ] Mobile App (React Native)

---

## 👨‍💻 Autor

<table>
  <tr>
    <td align="center">
      <strong>Mohammad El Zein</strong><br>
      Informatik Student @ TU Dortmund<br><br>
      <a href="https://github.com/Mohammad-El-Zein">
        <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
      </a>
      <a href="mailto:mhmdzein70781311@gmail.com">
        <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/>
      </a>
    </td>
  </tr>
</table>

### Über mich

Mohammad El Zein , Informatik Student 

**Skills:** `C` `C++` `Python` `Kotlin` `Java` `SQL` `HTML` `CSS` `JavaScript` `React` `Spring Boot` `MongoDB`

---

## 📄 Lizenz

Dieses Projekt ist für Bildungszwecke und als Portfolio-Projekt erstellt.


