package in.MoProjekt.foodweb.storage;

import org.springframework.web.multipart.MultipartFile;

// Speicher für Bilder (Gerichte, Kategorien, Logo, Startseite). Aktiv ist R2 oder MongoDB, siehe ImageStorageConfig.
public interface ImageStorage {

    // Prüft das Bild und gibt die öffentliche URL zurück; folder = foods | categories | site
    String upload(MultipartFile file, String folder);

    // Löscht ein Bild anhand seiner URL; Fehler werden nur geloggt
    void delete(String url);
}
