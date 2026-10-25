package in.MoProjekt.foodweb.entity;

import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Alle restaurantspezifischen Inhalte der Website. Es gibt genau ein Dokument (id = "main").
// Mehrsprachige Texte sind Maps mit den Schlüsseln "de", "en", "ar".
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "site_settings")
public class SiteSettingsEntity {

    public static final String SINGLETON_ID = "main";

    @Id
    @JsonIgnore
    private String id;

    private String restaurantName;
    private Map<String, String> slogan;
    private String logoUrl;
    private String faviconUrl;

    private String primaryColor;
    private String accentColor;

    // Startseite
    private Map<String, String> heroTitle;
    private Map<String, String> heroSubtitle;
    private String heroImageUrl;
    private List<Feature> features;

    // Über uns
    private Map<String, String> aboutTitle;
    private Map<String, String> aboutText;
    // Erstes Foto aus aboutImages (für ältere Clients)
    private String aboutImageUrl;
    // Fotos für "Über uns" (ab 2 Fotos Überblendung auf der Website)
    private List<String> aboutImages;

    private Contact contact;
    private OpeningHours openingHours;
    private Ordering ordering;

    private List<String> enabledLanguages;
    private String defaultLanguage;

    // Rechtliches
    private Map<String, String> imprint;
    private Map<String, String> privacyPolicy;

    private Map<String, String> footerText;

    private Date updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Feature {
        private Map<String, String> title;
        private Map<String, String> text;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Contact {
        private String address;
        private String phone;
        private String email;
        private String whatsapp;
        private String googleMapsUrl;
        // z. B. { "instagram": "https://...", "facebook": "https://..." }
        private Map<String, String> socialLinks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlot {
        // "HH:mm"; ist close vor open, geht der Zeitraum über Mitternacht
        private String open;
        private String close;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OpeningHours {
        private String timeZone;
        // Schlüssel MONDAY ... SUNDAY; leere Liste = geschlossen
        private Map<String, List<TimeSlot>> days;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Ordering {
        private double deliveryFee;
        private double minOrderAmount;
        private boolean pickupEnabled;
        private boolean deliveryEnabled;
        // Nur wenn true werden Bestellungen außerhalb der Öffnungszeiten abgelehnt
        private boolean ordersOnlyDuringOpeningHours;
    }
}
