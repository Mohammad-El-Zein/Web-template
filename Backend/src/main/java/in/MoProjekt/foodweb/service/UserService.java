package in.MoProjekt.foodweb.service;
import in.MoProjekt.foodweb.io.PasswordChangeRequest;
import in.MoProjekt.foodweb.io.ProfileResponse;
import in.MoProjekt.foodweb.io.UserRequest;
import in.MoProjekt.foodweb.io.UserResponse;

public interface UserService {

   UserResponse registerUser(UserRequest request);

  String findByUserId();

   ProfileResponse getProfile();

   ProfileResponse updateName(String name);

   void changePassword(PasswordChangeRequest request);

}
