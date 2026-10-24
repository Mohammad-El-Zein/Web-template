package in.MoProjekt.foodweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.TimeSlot;
import in.MoProjekt.foodweb.exception.SettingsValidationException;
import in.MoProjekt.foodweb.repository.SiteSettingsRepository;

@ExtendWith(MockitoExtension.class)
class SiteSettingsServiceImplTest {

    @Mock private SiteSettingsRepository repository;

    // Mittwoch, 15.01.2025, 12:00 Uhr in Berlin
    private final Clock clock = Clock.fixed(Instant.parse("2025-01-15T11:00:00Z"), ZoneOffset.UTC);
    private SiteSettingsServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SiteSettingsServiceImpl(repository, clock);
    }

    private SiteSettingsEntity valid() {
        return SiteSettingsDefaults.create(2025);
    }

    @Test
    void defaultsAreReturnedWhenNothingIsStored() {
        when(repository.findById("main")).thenReturn(Optional.empty());

        SiteSettingsEntity settings = service.getSettings();

        assertEquals("FlavorHaus", settings.getRestaurantName());
        assertEquals("#9a401c", settings.getPrimaryColor());
        assertEquals("#f6ba20", settings.getAccentColor());
        assertEquals(3.0, settings.getOrdering().getDeliveryFee(), 0.0001);
        assertFalse(settings.getOrdering().isOrdersOnlyDuringOpeningHours());
        assertEquals("Europe/Berlin", settings.getOpeningHours().getTimeZone());
        assertEquals(List.of(new TimeSlot("11:00", "22:00")), settings.getOpeningHours().getDays().get("SUNDAY"));
        assertEquals(4, settings.getFeatures().size());
        assertEquals("Über uns", settings.getAboutTitle().get("de"));
        assertEquals("© 2025 FlavorHaus. Alle Rechte vorbehalten.", settings.getFooterText().get("de"));
    }

    @Test
    void defaultsAreSavedOnlyIfMissing() {
        when(repository.existsById("main")).thenReturn(true);
        service.createDefaultsIfMissing();
        verify(repository, never()).save(any());

        when(repository.existsById("main")).thenReturn(false);
        service.createDefaultsIfMissing();
        ArgumentCaptor<SiteSettingsEntity> saved = ArgumentCaptor.forClass(SiteSettingsEntity.class);
        verify(repository).save(saved.capture());
        assertEquals("main", saved.getValue().getId());
    }

    @Test
    void validSettingsAreSavedAsSingleDocument() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        SiteSettingsEntity settings = valid();
        settings.setId("anderer");
        settings.getOpeningHours().getDays().remove("MONDAY");

        SiteSettingsEntity saved = service.updateSettings(settings);

        assertEquals("main", saved.getId());
        assertNotNull(saved.getUpdatedAt());
        // Fehlender Wochentag = geschlossen
        assertTrue(saved.getOpeningHours().getDays().get("MONDAY").isEmpty());
    }

    private void assertInvalid(String field, Consumer<SiteSettingsEntity> change) {
        SiteSettingsEntity settings = valid();
        change.accept(settings);
        SettingsValidationException ex = assertThrows(SettingsValidationException.class,
                () -> service.updateSettings(settings));
        assertEquals(field, ex.getField());
        verify(repository, never()).save(any());
    }

    @Test
    void colorsMustBeHex() {
        assertInvalid("primaryColor", s -> s.setPrimaryColor("red"));
        assertInvalid("accentColor", s -> s.setAccentColor("#f6ba2"));
    }

    @Test
    void textsAreLimited() {
        assertInvalid("restaurantName", s -> s.setRestaurantName(" "));
        assertInvalid("heroTitle.de", s -> s.setHeroTitle(Map.of("de", "x".repeat(201))));
        assertInvalid("aboutText", s -> s.setAboutText(Map.of("fr", "Bonjour")));
        assertInvalid("features", s -> {
            List<SiteSettingsEntity.Feature> features = new ArrayList<>();
            for (int i = 0; i < 9; i++) features.add(new SiteSettingsEntity.Feature());
            s.setFeatures(features);
        });
    }

    @Test
    void onlySupportedLanguages() {
        assertInvalid("enabledLanguages", s -> s.setEnabledLanguages(List.of("de", "fr")));
        assertInvalid("enabledLanguages", s -> s.setEnabledLanguages(List.of()));
        assertInvalid("defaultLanguage", s -> {
            s.setEnabledLanguages(List.of("en", "ar"));
            s.setDefaultLanguage("de");
        });
    }

    @Test
    void timesMustBeValid() {
        assertInvalid("openingHours.days.MONDAY[0].open",
                s -> s.getOpeningHours().getDays().put("MONDAY", List.of(new TimeSlot("25:00", "22:00"))));
        assertInvalid("openingHours.days.MONDAY[0].close",
                s -> s.getOpeningHours().getDays().put("MONDAY", List.of(new TimeSlot("11:00", "9:30"))));
        assertInvalid("openingHours.days.MONDAY[0]",
                s -> s.getOpeningHours().getDays().put("MONDAY", List.of(new TimeSlot("11:00", "11:00"))));
        assertInvalid("openingHours.days.FUNDAY", s -> s.getOpeningHours().getDays().put("FUNDAY", List.of()));
        assertInvalid("openingHours.timeZone", s -> s.getOpeningHours().setTimeZone("Mars/Base"));
    }

    @Test
    void urlsContactAndAmountsAreChecked() {
        assertInvalid("logoUrl", s -> s.setLogoUrl("javascript:alert(1)"));
        assertInvalid("contact.email", s -> s.getContact().setEmail("keine-mail"));
        assertInvalid("contact.socialLinks.instagram",
                s -> s.getContact().getSocialLinks().put("instagram", "data:text/html,x"));
        assertInvalid("ordering.deliveryFee", s -> s.getOrdering().setDeliveryFee(-1));
        assertInvalid("ordering.minOrderAmount", s -> s.getOrdering().setMinOrderAmount(Double.NaN));
    }

    @Test
    void isOpenNowUsesStoredOpeningHours() {
        when(repository.findById("main")).thenReturn(Optional.of(valid()));
        assertTrue(service.isOpenNow());
    }
}
