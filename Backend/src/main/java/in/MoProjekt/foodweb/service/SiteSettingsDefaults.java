package in.MoProjekt.foodweb.service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.Contact;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.Feature;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.OpeningHours;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.Ordering;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.TimeSlot;

// Startinhalt (FlavorHaus-Demo), wird angelegt, wenn noch kein Dokument existiert.
// Texte stammen aus Frontend/public/locales/{de,en,ar}/translation.json.
public final class SiteSettingsDefaults {

    private SiteSettingsDefaults() {
    }

    public static SiteSettingsEntity create(int year) {
        return SiteSettingsEntity.builder()
                .id(SiteSettingsEntity.SINGLETON_ID)
                .restaurantName("FlavorHaus")
                .slogan(texts(
                        "Bestell dein Lieblingsessen direkt bei uns.",
                        "Order your favorite meals directly from us.",
                        "اطلب وجباتك المفضلة مباشرة منا."))
                .logoUrl("")
                .faviconUrl("")
                .primaryColor("#9a401c")
                .accentColor("#f6ba20")
                .heroTitle(texts("FLAVOR HAUS", "FLAVOR HAUS", "FLAVOR HAUS"))
                .heroSubtitle(texts(
                        "Premium-Qualität, faire Preise und schnelle Lieferung garantiert",
                        "Premium quality, fair prices and fast delivery guaranteed",
                        "جودة عالية، أسعار عادلة وتوصيل سريع مضمون"))
                .heroImageUrl("")
                .features(new ArrayList<>(List.of(
                        feature("Frische Zutaten", "Wir verwenden nur die frischesten Zutaten für unsere Gerichte.",
                                "Fresh Ingredients", "We use only the freshest ingredients for our dishes.",
                                "مكونات طازجة", "نستخدم أطزج المكونات فقط في أطباقنا."),
                        feature("Schnelle Lieferung", "Erhalte deine Bestellung in max 25 Minuten.",
                                "Fast Delivery", "Receive your order in a maximum of 25 minutes.",
                                "توصيل سريع", "استلم طلبك خلال 25 دقيقة كحد أقصى."),
                        feature("Professioneller Service", "Schnell, freundlich und zuverlässig.",
                                "Professional Service", "Fast, friendly and reliable.",
                                "خدمة احترافية", "سريعة، ودودة وموثوقة."),
                        feature("Parkmöglichkeiten", "Praktische Parkplätze stehen dir jederzeit zur Verfügung.",
                                "Parking Options", "Convenient parking spaces are always available.",
                                "مواقف للسيارات", "تتوفر دائماً أماكن مريحة لركن السيارات."))))
                .aboutTitle(texts("Über uns", "About us", "من نحن"))
                .aboutText(texts(
                        "Frische Küche mit Zutaten aus der Region. Bei uns wird jedes Gericht frisch zubereitet.",
                        "Fresh cooking with local ingredients. Every dish is freshly prepared in our kitchen.",
                        "مطبخ طازج بمكونات من المنطقة. نحضّر كل طبق عندنا طازجاً."))
                .aboutImageUrl("")
                .contact(Contact.builder()
                        .address("").phone("").email("").whatsapp("").googleMapsUrl("")
                        .socialLinks(new LinkedHashMap<>())
                        .build())
                .openingHours(OpeningHours.builder()
                        .timeZone("Europe/Berlin")
                        .days(everyDay("11:00", "22:00"))
                        .build())
                .ordering(Ordering.builder()
                        .deliveryFee(3.0)
                        .minOrderAmount(0.0)
                        .pickupEnabled(true)
                        .deliveryEnabled(true)
                        // Demo nimmt rund um die Uhr Bestellungen an
                        .ordersOnlyDuringOpeningHours(false)
                        .build())
                .enabledLanguages(new ArrayList<>(List.of("de", "en", "ar")))
                .defaultLanguage("de")
                .imprint(texts("", "", ""))
                .privacyPolicy(texts("", "", ""))
                .footerText(texts(
                        "© " + year + " FlavorHaus. Alle Rechte vorbehalten.",
                        "© " + year + " FlavorHaus. All rights reserved.",
                        "© " + year + " FlavorHaus. جميع الحقوق محفوظة."))
                .build();
    }

    private static Map<String, String> texts(String de, String en, String ar) {
        Map<String, String> texts = new LinkedHashMap<>();
        texts.put("de", de);
        texts.put("en", en);
        texts.put("ar", ar);
        return texts;
    }

    private static Feature feature(String titleDe, String textDe, String titleEn, String textEn,
                                   String titleAr, String textAr) {
        return Feature.builder()
                .title(texts(titleDe, titleEn, titleAr))
                .text(texts(textDe, textEn, textAr))
                .build();
    }

    private static Map<String, List<TimeSlot>> everyDay(String open, String close) {
        Map<String, List<TimeSlot>> days = new LinkedHashMap<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            days.put(day.name(), new ArrayList<>(List.of(new TimeSlot(open, close))));
        }
        return days;
    }
}
