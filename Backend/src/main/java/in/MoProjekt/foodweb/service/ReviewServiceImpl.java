package in.MoProjekt.foodweb.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.ReviewEntity;
import in.MoProjekt.foodweb.exception.ReviewException;
import in.MoProjekt.foodweb.io.ReviewRequest;
import in.MoProjekt.foodweb.io.ReviewResponse;
import in.MoProjekt.foodweb.repository.ReviewRepository;
import in.MoProjekt.foodweb.storage.ImageStorage;
import in.MoProjekt.foodweb.util.UrlCheck;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private static final String ALL_LANGUAGES = "all";
    private static final int MAX_AUTHOR_LENGTH = 100;
    private static final int MAX_TEXT_LENGTH = 1000;
    private static final int MAX_SOURCE_LENGTH = 50;

    private final ReviewRepository reviewRepository;
    private final TranslationHelper translationHelper;
    private final ImageStorage imageStorage;
    private final Clock clock;

    @Override
    public List<ReviewResponse> readVisibleReviews(String lang) {
        return reviewRepository.findByVisibleTrueOrderBySortOrderAsc().stream()
                .map(review -> ALL_LANGUAGES.equals(lang) ? convertToResponse(review) : convertToResponse(review, lang))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReviewResponse> readAllReviews() {
        return reviewRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewResponse addReview(ReviewRequest request) {
        LocalDate date = validate(request);
        List<ReviewEntity> existing = reviewRepository.findAllByOrderBySortOrderAsc();
        // Neue Bewertung kommt ans Ende
        int sortOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getSortOrder() + 1;

        ReviewEntity review = ReviewEntity.builder()
                .authorName(request.getAuthorName().trim())
                .text(translationHelper.completeTranslationsFromAny(request.getText()))
                .rating(request.getRating())
                .photoUrl(trimToEmpty(request.getPhotoUrl()))
                .source(trimToEmpty(request.getSource()))
                .date(date)
                .visible(request.getVisible() == null || request.getVisible())
                .sortOrder(sortOrder)
                .build();
        return convertToResponse(reviewRepository.save(review));
    }

    @Override
    public ReviewResponse updateReview(String id, ReviewRequest request) {
        LocalDate date = validate(request);
        ReviewEntity review = findById(id);
        String oldPhotoUrl = review.getPhotoUrl();

        review.setAuthorName(request.getAuthorName().trim());
        review.setText(translationHelper.completeTranslationsFromAny(request.getText()));
        review.setRating(request.getRating());
        review.setPhotoUrl(trimToEmpty(request.getPhotoUrl()));
        review.setSource(trimToEmpty(request.getSource()));
        review.setDate(date);
        if (request.getVisible() != null) {
            review.setVisible(request.getVisible());
        }
        ReviewEntity saved = reviewRepository.save(review);

        // Altes Foto löschen, wenn es ersetzt oder entfernt wurde
        if (oldPhotoUrl != null && !oldPhotoUrl.isBlank() && !oldPhotoUrl.equals(saved.getPhotoUrl())) {
            imageStorage.delete(oldPhotoUrl);
        }
        return convertToResponse(saved);
    }

    @Override
    public void deleteReview(String id) {
        ReviewEntity review = findById(id);
        reviewRepository.deleteById(id);
        if (review.getPhotoUrl() != null && !review.getPhotoUrl().isBlank()) {
            imageStorage.delete(review.getPhotoUrl());
        }
    }

    @Override
    public List<ReviewResponse> reorder(List<String> ids) {
        List<ReviewEntity> reviews = reviewRepository.findAllByOrderBySortOrderAsc();
        Map<String, ReviewEntity> byId = reviews.stream()
                .collect(Collectors.toMap(ReviewEntity::getId, Function.identity()));
        if (ids == null || ids.size() != reviews.size() || new HashSet<>(ids).size() != ids.size()
                || !byId.keySet().containsAll(ids)) {
            throw ReviewException.invalid("order", "Order must contain every review exactly once");
        }
        for (int i = 0; i < ids.size(); i++) {
            byId.get(ids.get(i)).setSortOrder(i);
        }
        reviewRepository.saveAll(reviews);
        return readAllReviews();
    }

    private ReviewEntity findById(String id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
    }

    // Prüft die Angaben und liefert das Datum (oder null)
    private LocalDate validate(ReviewRequest request) {
        if (request == null) {
            throw ReviewException.invalid("authorName", "Author name is required");
        }
        String author = request.getAuthorName();
        if (author == null || author.isBlank()) {
            throw ReviewException.invalid("authorName", "Author name is required");
        }
        if (author.trim().length() > MAX_AUTHOR_LENGTH) {
            throw ReviewException.invalid("authorName", "Author name is too long (max " + MAX_AUTHOR_LENGTH + " characters)");
        }

        Map<String, String> text = request.getText();
        if (text != null) {
            for (Map.Entry<String, String> entry : text.entrySet()) {
                if (!OpenAITranslationService.LANGUAGES.containsKey(entry.getKey())) {
                    throw ReviewException.invalid("text", "Unsupported language: " + entry.getKey());
                }
                if (entry.getValue() != null && entry.getValue().trim().length() > MAX_TEXT_LENGTH) {
                    throw ReviewException.invalid("text." + entry.getKey(),
                            "Text is too long (max " + MAX_TEXT_LENGTH + " characters)");
                }
            }
        }
        // Mindestens eine Sprache (Bewertungen werden oft auf Englisch oder Arabisch geschrieben)
        if (TranslationHelper.firstLanguage(text) == null) {
            throw ReviewException.invalid("text", "Text is required in at least one language");
        }

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw ReviewException.invalid("rating", "Rating must be between 1 and 5");
        }
        if (!UrlCheck.isAllowed(request.getPhotoUrl())) {
            throw ReviewException.invalid("photoUrl",
                    "URL must start with http://, https:// or / (max " + UrlCheck.MAX_URL_LENGTH + " characters)");
        }
        if (request.getSource() != null && request.getSource().trim().length() > MAX_SOURCE_LENGTH) {
            throw ReviewException.invalid("source", "Source is too long (max " + MAX_SOURCE_LENGTH + " characters)");
        }
        return parseDate(request.getDate());
    }

    // "YYYY-MM-DD", nicht in der Zukunft (ein Tag Spielraum wegen Zeitzonen, die Uhr läuft in UTC)
    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        LocalDate date;
        try {
            date = LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw ReviewException.invalid("date", "Date must have the format YYYY-MM-DD");
        }
        if (date.isAfter(LocalDate.now(clock).plusDays(1))) {
            throw ReviewException.invalid("date", "Date must not be in the future");
        }
        return date;
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private ReviewResponse convertToResponse(ReviewEntity review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .authorName(review.getAuthorName())
                .text(review.getText())
                .rating(review.getRating())
                .photoUrl(review.getPhotoUrl())
                .source(review.getSource())
                .date(review.getDate())
                .visible(review.isVisible())
                .sortOrder(review.getSortOrder())
                .build();
    }

    // Text nur in einer Sprache (Fallback wie bei Kategorien: gewünschte Sprache, Englisch, Deutsch)
    private ReviewResponse convertToResponse(ReviewEntity review, String lang) {
        ReviewResponse response = convertToResponse(review);
        response.setText(Map.of(lang, textFor(review.getText(), lang)));
        return response;
    }

    // Wie TranslationHelper.textFor; zusätzlich Arabisch, falls die Bewertung nur arabisch vorliegt
    private String textFor(Map<String, String> texts, String lang) {
        String text = TranslationHelper.textFor(texts, lang);
        if (text.isEmpty() && texts != null && texts.get("ar") != null) {
            return texts.get("ar");
        }
        return text;
    }
}
