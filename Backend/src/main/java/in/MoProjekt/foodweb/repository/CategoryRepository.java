package in.MoProjekt.foodweb.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import in.MoProjekt.foodweb.entity.CategoryEntity;

@Repository
public interface CategoryRepository extends MongoRepository<CategoryEntity, String> {

    List<CategoryEntity> findAllByOrderBySortOrderAsc();

    List<CategoryEntity> findByActiveTrueOrderBySortOrderAsc();

    boolean existsBySlug(String slug);
}
