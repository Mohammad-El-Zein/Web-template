package in.MoProjekt.foodweb.migration;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import in.MoProjekt.foodweb.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;

// Legt beim Start die Website-Einstellungen mit dem FlavorHaus-Inhalt an, falls noch keine existieren
@Component
@RequiredArgsConstructor
public class SiteSettingsInitializer {

    private final SiteSettingsService siteSettingsService;

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        try {
            siteSettingsService.createDefaultsIfMissing();
        } catch (Exception ex) {
            System.out.println("Could not create default site settings: " + ex.getMessage());
        }
    }
}
