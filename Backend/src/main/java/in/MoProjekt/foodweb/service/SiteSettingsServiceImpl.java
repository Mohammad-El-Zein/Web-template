package in.MoProjekt.foodweb.service;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.time.Year;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.Contact;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.Feature;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.OpeningHours;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.Ordering;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.TimeSlot;
import in.MoProjekt.foodweb.exception.SettingsValidationException;
import in.MoProjekt.foodweb.repository.SiteSettingsRepository;
import in.MoProjekt.foodweb.util.UrlCheck;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class SiteSettingsServiceImpl implements SiteSettingsService {

    public static final List<String> SUPPORTED_LANGUAGES = List.of("de", "en", "ar");

    private static final int MAX_NAME_LENGTH = 100;
    private static final int MAX_SHORT_TEXT = 200;
    private static final int MAX_LONG_TEXT = 5000;
    private static final int MAX_LEGAL_TEXT = 20000;
    private static final int MAX_FEATURES = 8;
    private static final int MAX_SLOTS_PER_DAY = 5;
    private static final int MAX_SOCIAL_LINKS = 10;
    private static final double MAX_AMOUNT = 1000;

    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private static final Pattern TIME = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern SOCIAL_KEY = Pattern.compile("^[a-z0-9_-]{1,30}$");

    private final SiteSettingsRepository siteSettingsRepository;
    private final Clock clock;

    @Override
    public SiteSettingsEntity getSettings() {
        // Fallback, falls das Dokument (noch) fehlt
        return siteSettingsRepository.findById(SiteSettingsEntity.SINGLETON_ID)
                .orElseGet(this::defaults);
    }

    @Override
    public SiteSettingsEntity updateSettings(SiteSettingsEntity settings) {
        if (settings == null) {
            throw new SettingsValidationException("", "Settings are missing");
        }
        normalize(settings);
        validate(settings);
        settings.setId(SiteSettingsEntity.SINGLETON_ID);
        settings.setUpdatedAt(Date.from(clock.instant()));
        return siteSettingsRepository.save(settings);
    }

    @Override
    public void createDefaultsIfMissing() {
        if (!siteSettingsRepository.existsById(SiteSettingsEntity.SINGLETON_ID)) {
            siteSettingsRepository.save(defaults());
        }
    }

    @Override
    public boolean isOpenNow() {
        return isOpenAt(getSettings().getOpeningHours(), clock.instant());
    }

    private SiteSettingsEntity defaults() {
        return SiteSettingsDefaults.create(Year.now(clock).getValue());
    }

    // Prüft die Zeitfenster von heute und Zeitfenster von gestern, die über Mitternacht gehen
    public static boolean isOpenAt(OpeningHours hours, Instant instant) {
        if (hours == null || hours.getDays() == null) {
            return false;
        }
        ZonedDateTime local = instant.atZone(ZoneId.of(hours.getTimeZone()));
        LocalTime now = local.toLocalTime();
        DayOfWeek today = local.getDayOfWeek();

        for (TimeSlot slot : hours.getDays().getOrDefault(today.name(), List.of())) {
            LocalTime open = LocalTime.parse(slot.getOpen());
            LocalTime close = LocalTime.parse(slot.getClose());
            boolean overnight = close.isBefore(open);
            if (!now.isBefore(open) && (overnight || now.isBefore(close))) {
                return true;
            }
        }
        for (TimeSlot slot : hours.getDays().getOrDefault(today.minus(1).name(), List.of())) {
            LocalTime open = LocalTime.parse(slot.getOpen());
            LocalTime close = LocalTime.parse(slot.getClose());
            if (close.isBefore(open) && now.isBefore(close)) {
                return true;
            }
        }
        return false;
    }

    // Fehlende Listen/Maps durch leere ersetzen, fehlende Wochentage = geschlossen
    private void normalize(SiteSettingsEntity s) {
        if (s.getFeatures() == null) s.setFeatures(new ArrayList<>());
        if (s.getContact() == null) s.setContact(new Contact());
        if (s.getContact().getSocialLinks() == null) s.getContact().setSocialLinks(new LinkedHashMap<>());
        if (s.getEnabledLanguages() == null) s.setEnabledLanguages(new ArrayList<>());
        if (s.getOpeningHours() != null) {
            Map<String, List<TimeSlot>> days = s.getOpeningHours().getDays() != null
                    ? new LinkedHashMap<>(s.getOpeningHours().getDays())
                    : new LinkedHashMap<>();
            for (DayOfWeek day : DayOfWeek.values()) {
                if (days.get(day.name()) == null) {
                    days.put(day.name(), new ArrayList<>());
                }
            }
            s.getOpeningHours().setDays(days);
        }
        if (s.getRestaurantName() != null) s.setRestaurantName(s.getRestaurantName().trim());
    }

    private void validate(SiteSettingsEntity s) {
        if (s.getRestaurantName() == null || s.getRestaurantName().isBlank()) {
            fail("restaurantName", "Restaurant name is required");
        }
        maxLength("restaurantName", s.getRestaurantName(), MAX_NAME_LENGTH);
        texts("slogan", s.getSlogan(), MAX_SHORT_TEXT);
        url("logoUrl", s.getLogoUrl());
        url("faviconUrl", s.getFaviconUrl());

        color("primaryColor", s.getPrimaryColor());
        color("accentColor", s.getAccentColor());

        texts("heroTitle", s.getHeroTitle(), MAX_SHORT_TEXT);
        texts("heroSubtitle", s.getHeroSubtitle(), MAX_SHORT_TEXT);
        url("heroImageUrl", s.getHeroImageUrl());
        if (s.getFeatures().size() > MAX_FEATURES) {
            fail("features", "At most " + MAX_FEATURES + " features are allowed");
        }
        for (int i = 0; i < s.getFeatures().size(); i++) {
            Feature feature = s.getFeatures().get(i);
            String field = "features[" + i + "]";
            if (feature == null) {
                fail(field, "Feature is missing");
            }
            texts(field + ".title", feature.getTitle(), MAX_SHORT_TEXT);
            texts(field + ".text", feature.getText(), MAX_LONG_TEXT);
            url(field + ".imageUrl", feature.getImageUrl());
        }

        texts("aboutTitle", s.getAboutTitle(), MAX_SHORT_TEXT);
        texts("aboutText", s.getAboutText(), MAX_LONG_TEXT);
        url("aboutImageUrl", s.getAboutImageUrl());

        validateContact(s.getContact());
        validateOpeningHours(s.getOpeningHours());
        validateOrdering(s.getOrdering());
        validateLanguages(s.getEnabledLanguages(), s.getDefaultLanguage());

        texts("imprint", s.getImprint(), MAX_LEGAL_TEXT);
        texts("privacyPolicy", s.getPrivacyPolicy(), MAX_LEGAL_TEXT);
        texts("footerText", s.getFooterText(), MAX_SHORT_TEXT);
    }

    private void validateContact(Contact contact) {
        maxLength("contact.address", contact.getAddress(), 300);
        maxLength("contact.phone", contact.getPhone(), 50);
        maxLength("contact.whatsapp", contact.getWhatsapp(), 50);
        maxLength("contact.email", contact.getEmail(), MAX_SHORT_TEXT);
        if (notBlank(contact.getEmail()) && !EMAIL.matcher(contact.getEmail()).matches()) {
            fail("contact.email", "Invalid email address");
        }
        url("contact.googleMapsUrl", contact.getGoogleMapsUrl());
        if (contact.getSocialLinks().size() > MAX_SOCIAL_LINKS) {
            fail("contact.socialLinks", "At most " + MAX_SOCIAL_LINKS + " social links are allowed");
        }
        for (Map.Entry<String, String> link : contact.getSocialLinks().entrySet()) {
            if (link.getKey() == null || !SOCIAL_KEY.matcher(link.getKey()).matches()) {
                fail("contact.socialLinks", "Invalid social network name: " + link.getKey());
            }
            url("contact.socialLinks." + link.getKey(), link.getValue());
        }
    }

    private void validateOpeningHours(OpeningHours hours) {
        if (hours == null) {
            fail("openingHours", "Opening hours are required");
        }
        if (!notBlank(hours.getTimeZone())) {
            fail("openingHours.timeZone", "Time zone is required");
        }
        try {
            ZoneId.of(hours.getTimeZone());
        } catch (DateTimeException ex) {
            fail("openingHours.timeZone", "Unknown time zone: " + hours.getTimeZone());
        }
        Set<String> weekdays = new HashSet<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            weekdays.add(day.name());
        }
        for (Map.Entry<String, List<TimeSlot>> day : hours.getDays().entrySet()) {
            String field = "openingHours.days." + day.getKey();
            if (!weekdays.contains(day.getKey())) {
                fail(field, "Unknown weekday: " + day.getKey());
            }
            if (day.getValue().size() > MAX_SLOTS_PER_DAY) {
                fail(field, "At most " + MAX_SLOTS_PER_DAY + " time slots per day are allowed");
            }
            for (int i = 0; i < day.getValue().size(); i++) {
                TimeSlot slot = day.getValue().get(i);
                String slotField = field + "[" + i + "]";
                if (slot == null) {
                    fail(slotField, "Time slot is missing");
                }
                time(slotField + ".open", slot.getOpen());
                time(slotField + ".close", slot.getClose());
                if (slot.getOpen().equals(slot.getClose())) {
                    fail(slotField, "Opening and closing time must differ");
                }
            }
        }
    }

    private void validateOrdering(Ordering ordering) {
        if (ordering == null) {
            fail("ordering", "Ordering settings are required");
        }
        amount("ordering.deliveryFee", ordering.getDeliveryFee());
        amount("ordering.minOrderAmount", ordering.getMinOrderAmount());
    }

    private void validateLanguages(List<String> enabled, String defaultLanguage) {
        if (enabled.isEmpty()) {
            fail("enabledLanguages", "At least one language must be enabled");
        }
        if (new HashSet<>(enabled).size() != enabled.size()) {
            fail("enabledLanguages", "Languages must not repeat");
        }
        for (String language : enabled) {
            if (!SUPPORTED_LANGUAGES.contains(language)) {
                fail("enabledLanguages", "Unsupported language: " + language);
            }
        }
        if (defaultLanguage == null || !enabled.contains(defaultLanguage)) {
            fail("defaultLanguage", "Default language must be one of the enabled languages");
        }
    }

    // Mehrsprachiger Text: nur de/en/ar erlaubt, jede Sprache mit Höchstlänge
    private void texts(String field, Map<String, String> texts, int maxLength) {
        if (texts == null) {
            return;
        }
        for (Map.Entry<String, String> text : texts.entrySet()) {
            if (!SUPPORTED_LANGUAGES.contains(text.getKey())) {
                fail(field, "Unsupported language: " + text.getKey());
            }
            maxLength(field + "." + text.getKey(), text.getValue(), maxLength);
        }
    }

    private void url(String field, String url) {
        maxLength(field, url, UrlCheck.MAX_URL_LENGTH);
        if (!UrlCheck.isAllowed(url)) {
            fail(field, "URL must start with http://, https:// or /");
        }
    }

    private void color(String field, String color) {
        if (color == null || !HEX_COLOR.matcher(color).matches()) {
            fail(field, "Color must be a hex value like #9a401c");
        }
    }

    private void time(String field, String time) {
        if (time == null || !TIME.matcher(time).matches()) {
            fail(field, "Time must have the format HH:mm");
        }
    }

    private void amount(String field, double value) {
        if (Double.isNaN(value) || value < 0 || value > MAX_AMOUNT) {
            fail(field, "Amount must be between 0 and " + (int) MAX_AMOUNT);
        }
    }

    private void maxLength(String field, String value, int maxLength) {
        if (value != null && value.length() > maxLength) {
            fail(field, "Text is too long (max " + maxLength + " characters)");
        }
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private void fail(String field, String message) {
        throw new SettingsValidationException(field, message);
    }
}
