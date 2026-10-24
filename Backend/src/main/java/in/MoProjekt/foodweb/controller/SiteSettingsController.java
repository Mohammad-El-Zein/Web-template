package in.MoProjekt.foodweb.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity;
import in.MoProjekt.foodweb.service.SiteSettingsService;
import lombok.AllArgsConstructor;

// Öffentlich lesbar (siehe SecurityConfig: GET /api/settings)
@RestController
@RequestMapping("/api/settings")
@AllArgsConstructor
public class SiteSettingsController {

    private final SiteSettingsService siteSettingsService;

    @GetMapping
    public SiteSettingsEntity getSettings() {
        return siteSettingsService.getSettings();
    }
}
