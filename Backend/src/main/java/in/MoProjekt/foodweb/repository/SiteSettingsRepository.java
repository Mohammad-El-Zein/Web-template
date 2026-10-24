package in.MoProjekt.foodweb.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import in.MoProjekt.foodweb.entity.SiteSettingsEntity;

@Repository
public interface SiteSettingsRepository extends MongoRepository<SiteSettingsEntity, String> {
}
