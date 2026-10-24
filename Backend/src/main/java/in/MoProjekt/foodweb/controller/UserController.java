package in.MoProjekt.foodweb.controller;

import org.springframework.http.HttpStatus;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import in.MoProjekt.foodweb.io.PasswordChangeRequest;
import in.MoProjekt.foodweb.io.ProfileResponse;
import in.MoProjekt.foodweb.io.UserRequest;
import in.MoProjekt.foodweb.io.UserResponse;
import in.MoProjekt.foodweb.service.UserService;
import lombok.AllArgsConstructor;




@RestController
@AllArgsConstructor
@RequestMapping("/api")

public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@RequestBody UserRequest request){
        return userService.registerUser(request);
    }

    // Profil des eingeloggten Benutzers
    @GetMapping("/me")
    public ProfileResponse me() {
        return userService.getProfile();
    }

    @PutMapping("/me")
    public ProfileResponse updateProfile(@RequestBody Map<String, String> body) {
        return userService.updateName(body.get("name"));
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestBody PasswordChangeRequest request) {
        userService.changePassword(request);
    }

}
