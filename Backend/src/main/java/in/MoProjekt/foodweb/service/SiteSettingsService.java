package in.MoProjekt.foodweb.service;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity;

public interface SiteSettingsService {

    SiteSettingsEntity getSettings();

    SiteSettingsEntity updateSettings(SiteSettingsEntity settings);

    // Legt den Startinhalt an, falls noch keine Einstellungen gespeichert sind
    void createDefaultsIfMissing();

    boolean isOpenNow();
}
