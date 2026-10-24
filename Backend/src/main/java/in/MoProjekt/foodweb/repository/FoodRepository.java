package in.MoProjekt.foodweb.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import in.MoProjekt.foodweb.entity.FoodEntity;
import org.springframework.stereotype.Repository;

@Repository

public interface FoodRepository extends MongoRepository<FoodEntity, String>  {

}
