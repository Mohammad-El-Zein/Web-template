package in.MoProjekt.foodweb.util;

// Erlaubt nur http(s)-Links oder Pfade der eigenen Seite (verhindert z. B. "javascript:")
public final class UrlCheck {

    public static final int MAX_URL_LENGTH = 500;

    private UrlCheck() {
    }

    public static boolean isAllowed(String url) {
        if (url == null || url.isBlank()) {
            return true;
        }
        if (url.length() > MAX_URL_LENGTH) {
            return false;
        }
        String lower = url.trim().toLowerCase();
        boolean ownPath = lower.startsWith("/") && !lower.startsWith("//");
        return lower.startsWith("https://") || lower.startsWith("http://") || ownPath;
    }
}
