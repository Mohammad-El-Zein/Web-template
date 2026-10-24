package in.MoProjekt.foodweb.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity.OpeningHours;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity.TimeSlot;

class SiteSettingsOpeningHoursTest {

    // Mittags- und Abendöffnung unter der Woche, Freitag bis 02:00, Sonntag geschlossen
    private OpeningHours hours() {
        Map<String, List<TimeSlot>> days = new LinkedHashMap<>();
        days.put("WEDNESDAY", List.of(new TimeSlot("11:00", "14:30"), new TimeSlot("17:00", "22:00")));
        days.put("FRIDAY", List.of(new TimeSlot("18:00", "02:00")));
        days.put("SATURDAY", List.of(new TimeSlot("12:00", "22:00")));
        days.put("SUNDAY", List.of());
        return new OpeningHours("Europe/Berlin", days);
    }

    // Zeiten in UTC; Berlin ist im Januar UTC+1, im Juli UTC+2
    private boolean openAt(String utc) {
        return SiteSettingsServiceImpl.isOpenAt(hours(), Instant.parse(utc));
    }

    @Test
    void openInsideTimeSlots() {
        assertTrue(openAt("2025-01-15T10:00:00Z"));  // Mi 11:00 (Beginn zählt)
        assertTrue(openAt("2025-01-15T13:29:00Z"));  // Mi 14:29
        assertTrue(openAt("2025-01-15T20:00:00Z"));  // Mi 21:00
    }

    @Test
    void closedBetweenAndOutsideSlots() {
        assertFalse(openAt("2025-01-15T09:59:00Z")); // Mi 10:59
        assertFalse(openAt("2025-01-15T13:30:00Z")); // Mi 14:30 (Ende zählt nicht)
        assertFalse(openAt("2025-01-15T15:00:00Z")); // Mi 16:00, Mittagspause
        assertFalse(openAt("2025-01-15T21:00:00Z")); // Mi 22:00
    }

    @Test
    void closedDayAndMissingDay() {
        assertFalse(openAt("2025-01-19T12:00:00Z")); // So 13:00, leere Liste
        assertFalse(openAt("2025-01-13T12:00:00Z")); // Mo 13:00, Tag fehlt
    }

    @Test
    void slotOverMidnightCountsForNextDay() {
        assertTrue(openAt("2025-01-17T22:30:00Z"));  // Fr 23:30
        assertTrue(openAt("2025-01-18T00:30:00Z"));  // Sa 01:30, noch Freitag-Schicht
        assertFalse(openAt("2025-01-18T01:00:00Z")); // Sa 02:00
        assertFalse(openAt("2025-01-17T16:59:00Z")); // Fr 17:59
    }

    @Test
    void timeZoneIncludingSummerTimeIsUsed() {
        assertTrue(openAt("2025-07-16T09:00:00Z"));  // Mi 11:00 Sommerzeit
        assertFalse(openAt("2025-07-16T20:00:00Z")); // Mi 22:00 Sommerzeit
        assertTrue(SiteSettingsServiceImpl.isOpenAt(
                new OpeningHours("America/New_York", hours().getDays()),
                Instant.parse("2025-01-15T17:00:00Z"))); // Mi 12:00 in New York
    }
}
