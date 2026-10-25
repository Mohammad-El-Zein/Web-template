package in.MoProjekt.foodweb.service;

import java.util.List;

import in.MoProjekt.foodweb.io.ReviewRequest;
import in.MoProjekt.foodweb.io.ReviewResponse;

public interface ReviewService {

    // Nur sichtbare, sortiert; lang=all liefert alle Sprachen
    List<ReviewResponse> readVisibleReviews(String lang);

    // Für das Admin-Panel: alle, auch ausgeblendete
    List<ReviewResponse> readAllReviews();

    ReviewResponse addReview(ReviewRequest request);

    ReviewResponse updateReview(String id, ReviewRequest request);

    void deleteReview(String id);

    // ids in neuer Reihenfolge, muss jede Bewertung genau einmal enthalten
    List<ReviewResponse> reorder(List<String> ids);
}
