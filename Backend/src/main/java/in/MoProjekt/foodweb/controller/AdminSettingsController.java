package in.MoProjekt.foodweb.controller;

import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity;
import in.MoProjekt.foodweb.service.SiteSettingsService;
import lombok.AllArgsConstructor;

// Nur für Admins (siehe SecurityConfig: /api/admin/**)
@RestController
@RequestMapping("/api/admin/settings")
@AllArgsConstructor
public class AdminSettingsController {

    private final SiteSettingsService siteSettingsService;

    // Ersetzt alle Einstellungen (vollständiges JSON wie bei GET /api/settings)
    @PutMapping
    public SiteSettingsEntity updateSettings(@RequestBody SiteSettingsEntity settings) {
        return siteSettingsService.updateSettings(settings);
    }
}
