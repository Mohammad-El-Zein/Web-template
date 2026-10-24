package in.MoProjekt.foodweb.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import in.MoProjekt.foodweb.exception.ImageException;
import in.MoProjekt.foodweb.storage.ImageFiles;
import in.MoProjekt.foodweb.storage.ImageStorage;
import lombok.AllArgsConstructor;

// Nur für Admins (siehe SecurityConfig: /api/admin/**). Für Logo, Startseite, Kategoriebilder usw.
@RestController
@RequestMapping("/api/admin/images")
@AllArgsConstructor
public class AdminImageController {

    private final ImageStorage imageStorage;

    // multipart: file, optional folder = foods | categories | site (Standard: site) -> { "url": "..." }
    @PostMapping
    public Map<String, String> upload(@RequestPart(value = "file", required = false) MultipartFile file,
                                      @RequestParam(value = "folder", required = false) String folder) {
        String checkedFolder = ImageFiles.checkFolder(folder);
        if (file == null || file.isEmpty()) {
            throw ImageException.invalid("file", "Please upload an image");
        }
        return Map.of("url", imageStorage.upload(file, checkedFolder));
    }
}
