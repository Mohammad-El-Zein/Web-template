package in.MoProjekt.foodweb.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import in.MoProjekt.foodweb.entity.FoodImageEntity;

@Repository
public interface FoodImageRepository extends MongoRepository<FoodImageEntity, String> {
}
