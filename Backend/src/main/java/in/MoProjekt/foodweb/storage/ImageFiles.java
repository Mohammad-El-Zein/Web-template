package in.MoProjekt.foodweb.storage;

import java.io.IOException;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

import in.MoProjekt.foodweb.exception.ImageException;

// Prüft hochgeladene Bilder: nur JPEG, PNG, WebP, GIF (anhand der ersten Bytes, nicht des Browser-Headers), max. 5 MB.
// SVG ist bewusst nicht erlaubt, weil es JavaScript enthalten kann.
public final class ImageFiles {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    public static final Set<String> FOLDERS = Set.of("foods", "categories", "site", "reviews");

    private ImageFiles() {
    }

    // Geprüftes Bild mit erkanntem Typ
    public record CheckedImage(byte[] data, String contentType, String extension) {
    }

    public static CheckedImage check(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ImageException.invalid("file", "Please upload an image");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ImageException.tooLarge(MAX_BYTES);
        }
        if (file.getContentType() != null && !file.getContentType().startsWith("image/")) {
            throw ImageException.invalid("file", "Only images are allowed");
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException ex) {
            throw ImageException.invalid("file", "Could not read the image");
        }
        if (data.length > MAX_BYTES) {
            throw ImageException.tooLarge(MAX_BYTES);
        }
        if (startsWith(data, 0, 0xFF, 0xD8, 0xFF)) {
            return new CheckedImage(data, "image/jpeg", "jpg");
        }
        if (startsWith(data, 0, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
            return new CheckedImage(data, "image/png", "png");
        }
        if (startsWith(data, 0, 'G', 'I', 'F', '8') && data.length > 5 && (data[4] == '7' || data[4] == '9') && data[5] == 'a') {
            return new CheckedImage(data, "image/gif", "gif");
        }
        if (startsWith(data, 0, 'R', 'I', 'F', 'F') && startsWith(data, 8, 'W', 'E', 'B', 'P')) {
            return new CheckedImage(data, "image/webp", "webp");
        }
        throw ImageException.invalid("file", "Only JPEG, PNG, WebP or GIF images are allowed");
    }

    // null/leer = Standardordner "site"
    public static String checkFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "site";
        }
        if (!FOLDERS.contains(folder)) {
            throw ImageException.invalid("folder", "Folder must be one of foods, categories, site, reviews");
        }
        return folder;
    }

    private static boolean startsWith(byte[] data, int offset, int... expected) {
        if (data.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((data[offset + i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}
