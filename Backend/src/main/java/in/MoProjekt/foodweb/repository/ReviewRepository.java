package in.MoProjekt.foodweb.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import in.MoProjekt.foodweb.entity.ReviewEntity;

@Repository
public interface ReviewRepository extends MongoRepository<ReviewEntity, String> {

    List<ReviewEntity> findAllByOrderBySortOrderAsc();

    List<ReviewEntity> findByVisibleTrueOrderBySortOrderAsc();
}
