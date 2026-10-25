package in.MoProjekt.foodweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.ReviewEntity;
import in.MoProjekt.foodweb.exception.ReviewException;
import in.MoProjekt.foodweb.io.ReviewRequest;
import in.MoProjekt.foodweb.io.ReviewResponse;
import in.MoProjekt.foodweb.repository.ReviewRepository;
import in.MoProjekt.foodweb.storage.ImageStorage;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private OpenAITranslationService translator;
    @Mock private ImageStorage imageStorage;

    // 15.01.2025, 11:00 UTC
    private final Clock clock = Clock.fixed(Instant.parse("2025-01-15T11:00:00Z"), ZoneOffset.UTC);
    private ReviewServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ReviewServiceImpl(reviewRepository, new TranslationHelper(translator), imageStorage, clock);
    }

    private static Map<String, String> texts(String de, String en, String ar) {
        Map<String, String> text = new HashMap<>();
        if (de != null) text.put("de", de);
        if (en != null) text.put("en", en);
        if (ar != null) text.put("ar", ar);
        return text;
    }

    private ReviewRequest request(Map<String, String> text) {
        return ReviewRequest.builder().authorName(" Lena K. ").text(text).rating(5).source("Google").date("2025-01-10").build();
    }

    private ReviewEntity review(String id, int sortOrder, boolean visible, Map<String, String> text) {
        return ReviewEntity.builder().id(id).authorName("Gast " + id).text(text).rating(4)
                .sortOrder(sortOrder).visible(visible).photoUrl("").build();
    }

    private ReviewEntity savedReview() {
        ArgumentCaptor<ReviewEntity> saved = ArgumentCaptor.forClass(ReviewEntity.class);
        verify(reviewRepository).save(saved.capture());
        return saved.getValue();
    }

    @Test
    void createAddsReviewAtTheEndWithTranslationsFromGerman() {
        when(reviewRepository.findAllByOrderBySortOrderAsc())
                .thenReturn(List.of(review("r1", 0, true, texts("Gut", "Good", "جيد")), review("r2", 4, false, texts("Top", null, null))));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(translator.translate("Sehr lecker!", "German", "English")).thenReturn("Very tasty!");
        when(translator.translate("Sehr lecker!", "German", "Arabic")).thenReturn("لذيذ جداً!");

        ReviewResponse response = service.addReview(request(texts("Sehr lecker!", null, null)));

        ReviewEntity saved = savedReview();
        assertEquals(5, saved.getSortOrder());
        assertEquals("Lena K.", saved.getAuthorName());
        assertEquals(texts("Sehr lecker!", "Very tasty!", "لذيذ جداً!"), saved.getText());
        assertEquals(LocalDate.of(2025, 1, 10), saved.getDate());
        assertEquals("Google", saved.getSource());
        assertTrue(saved.isVisible());
        assertEquals("Very tasty!", response.getText().get("en"));
    }

    @Test
    void englishOnlyReviewIsTranslatedFromEnglish() {
        when(reviewRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of());
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(translator.translate("Great pizza", "English", "German")).thenReturn("Tolle Pizza");
        when(translator.translate("Great pizza", "English", "Arabic")).thenReturn("بيتزا رائعة");

        service.addReview(request(texts(null, "Great pizza", null)));

        assertEquals(texts("Tolle Pizza", "Great pizza", "بيتزا رائعة"), savedReview().getText());
        // Die Speisekarten-Übersetzung (nur aus dem Deutschen) wird nicht benutzt
        verify(translator, never()).translate(anyString(), anyString());
    }

    @Test
    void arabicOnlyReviewIsTranslatedFromArabic() {
        when(reviewRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of());
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(translator.translate("أكل ممتاز", "Arabic", "German")).thenReturn("Ausgezeichnetes Essen");
        when(translator.translate("أكل ممتاز", "Arabic", "English")).thenReturn("Excellent food");

        service.addReview(request(texts("", "  ", "أكل ممتاز")));

        assertEquals(texts("Ausgezeichnetes Essen", "Excellent food", "أكل ممتاز"), savedReview().getText());
    }

    @Test
    void failedTranslationKeepsLanguagesEmptyAndStillSaves() {
        when(reviewRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of());
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(translator.translate(anyString(), anyString(), anyString())).thenThrow(new RuntimeException("OpenAI down"));

        service.addReview(request(texts(null, "Great pizza", null)));

        assertEquals(texts(null, "Great pizza", null), savedReview().getText());
    }

    @Test
    void updateDeletesReplacedPhotoAndKeepsVisibility() {
        ReviewEntity existing = review("r1", 2, false, texts("Gut", "Good", "جيد"));
        existing.setPhotoUrl("https://img.example.com/reviews/alt.webp");
        when(reviewRepository.findById("r1")).thenReturn(Optional.of(existing));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ReviewRequest request = request(texts("Gut", "Good", "جيد"));
        request.setPhotoUrl("https://img.example.com/reviews/neu.webp");

        service.updateReview("r1", request);

        ReviewEntity saved = savedReview();
        assertFalse(saved.isVisible());
        assertEquals(2, saved.getSortOrder());
        assertEquals("https://img.example.com/reviews/neu.webp", saved.getPhotoUrl());
        verify(imageStorage).delete("https://img.example.com/reviews/alt.webp");
        // Alle Sprachen ausgefüllt -> keine Übersetzung
        verify(translator, never()).translate(anyString(), anyString(), anyString());
    }

    @Test
    void unchangedPhotoIsKept() {
        ReviewEntity existing = review("r1", 0, true, texts("Gut", "Good", "جيد"));
        existing.setPhotoUrl("https://img.example.com/reviews/a.webp");
        when(reviewRepository.findById("r1")).thenReturn(Optional.of(existing));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ReviewRequest request = request(texts("Gut", "Good", "جيد"));
        request.setPhotoUrl("https://img.example.com/reviews/a.webp");
        request.setVisible(false);
        request.setDate("");

        service.updateReview("r1", request);

        assertFalse(savedReview().isVisible());
        assertNull(existing.getDate());
        verify(imageStorage, never()).delete(anyString());
    }

    @Test
    void deleteRemovesReviewAndPhoto() {
        ReviewEntity existing = review("r1", 0, true, texts("Gut", null, null));
        existing.setPhotoUrl("https://img.example.com/reviews/a.webp");
        when(reviewRepository.findById("r1")).thenReturn(Optional.of(existing));

        service.deleteReview("r1");

        verify(reviewRepository).deleteById("r1");
        verify(imageStorage).delete("https://img.example.com/reviews/a.webp");
    }

    @Test
    void unknownReviewIsNotFound() {
        when(reviewRepository.findById("x")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.deleteReview("x"));
        assertThrows(ResponseStatusException.class, () -> service.updateReview("x", request(texts("Gut", "Good", "جيد"))));
    }

    @Test
    void reorderSetsSortOrderAndNeedsEveryReviewOnce() {
        List<ReviewEntity> reviews = new ArrayList<>(List.of(review("r1", 0, true, texts("A", null, null)),
                review("r2", 1, true, texts("B", null, null))));
        when(reviewRepository.findAllByOrderBySortOrderAsc()).thenReturn(reviews);

        service.reorder(List.of("r2", "r1"));
        assertEquals(1, reviews.get(0).getSortOrder());
        assertEquals(0, reviews.get(1).getSortOrder());

        for (List<String> wrong : List.of(List.of("r1"), List.of("r1", "r1"), List.of("r1", "r9"))) {
            ReviewException ex = assertThrows(ReviewException.class, () -> service.reorder(wrong));
            assertEquals("order", ex.getDetails().get("field"));
        }
    }

    @Test
    void publicListOnlyVisibleWithLanguageFallback() {
        when(reviewRepository.findByVisibleTrueOrderBySortOrderAsc()).thenReturn(List.of(
                review("r1", 0, true, texts("Gut", "Good", null)),
                review("r2", 1, true, texts(null, null, "ممتاز"))));

        List<ReviewResponse> ar = service.readVisibleReviews("ar");
        assertEquals(Map.of("ar", "Good"), ar.get(0).getText());
        assertEquals(Map.of("ar", "ممتاز"), ar.get(1).getText());
        // Nur arabisch vorhanden -> auch auf Deutsch der arabische Text statt leer
        assertEquals(Map.of("de", "ممتاز"), service.readVisibleReviews("de").get(1).getText());
        assertEquals(texts("Gut", "Good", null), service.readVisibleReviews("all").get(0).getText());
    }

    private void assertInvalid(String field, ReviewRequest request) {
        ReviewException ex = assertThrows(ReviewException.class, () -> service.addReview(request));
        assertEquals(ReviewException.REVIEW_INVALID, ex.getCode());
        assertEquals(field, ex.getDetails().get("field"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void invalidReviewsAreRejected() {
        ReviewRequest noAuthor = request(texts("Gut", null, null));
        noAuthor.setAuthorName("  ");
        assertInvalid("authorName", noAuthor);

        ReviewRequest longAuthor = request(texts("Gut", null, null));
        longAuthor.setAuthorName("x".repeat(101));
        assertInvalid("authorName", longAuthor);

        assertInvalid("text", request(texts(" ", "", null)));
        assertInvalid("text", request(null));
        assertInvalid("text", request(Map.of("fr", "Bon")));
        assertInvalid("text.en", request(texts(null, "x".repeat(1001), null)));

        for (Integer rating : new Integer[] { null, 0, 6 }) {
            ReviewRequest wrongRating = request(texts("Gut", null, null));
            wrongRating.setRating(rating);
            assertInvalid("rating", wrongRating);
        }

        ReviewRequest badPhoto = request(texts("Gut", null, null));
        badPhoto.setPhotoUrl("javascript:alert(1)");
        assertInvalid("photoUrl", badPhoto);

        ReviewRequest longSource = request(texts("Gut", null, null));
        longSource.setSource("x".repeat(51));
        assertInvalid("source", longSource);

        ReviewRequest badDate = request(texts("Gut", null, null));
        badDate.setDate("15.01.2025");
        assertInvalid("date", badDate);

        ReviewRequest futureDate = request(texts("Gut", null, null));
        futureDate.setDate("2025-02-01");
        assertInvalid("date", futureDate);
    }
}
