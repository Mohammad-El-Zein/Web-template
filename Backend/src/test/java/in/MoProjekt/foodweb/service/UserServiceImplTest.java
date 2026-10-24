package in.MoProjekt.foodweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.UserEntity;
import in.MoProjekt.foodweb.io.PasswordChangeRequest;
import in.MoProjekt.foodweb.io.UserRequest;
import in.MoProjekt.foodweb.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private AuthenticationFacade authenticationFacade;
    @Mock private AppUserDetailsService appUserDetailsService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private UserServiceImpl userService;
    private UserEntity user;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository, encoder, authenticationFacade, appUserDetailsService);
        user = UserEntity.builder().id("u1").name("Mo").email("mo@test.de").password(encoder.encode("alt123")).build();
    }

    private void loggedIn() {
        when(authenticationFacade.getAuthentication()).thenReturn(new UsernamePasswordAuthenticationToken("mo@test.de", null));
        when(userRepository.findByEmail("mo@test.de")).thenReturn(Optional.of(user));
    }

    @Test
    void profileShowsAdminRole() {
        loggedIn();
        when(appUserDetailsService.isAdmin("mo@test.de")).thenReturn(true);
        assertEquals("ADMIN", userService.getProfile().getRole());
    }

    @Test
    void passwordChangeNeedsCurrentPassword() {
        loggedIn();
        PasswordChangeRequest wrong = new PasswordChangeRequest();
        wrong.setCurrentPassword("falsch");
        wrong.setNewPassword("neu123456");
        assertThrows(ResponseStatusException.class, () -> userService.changePassword(wrong));
        verify(userRepository, never()).save(any());

        PasswordChangeRequest ok = new PasswordChangeRequest();
        ok.setCurrentPassword("alt123");
        ok.setNewPassword("neu123456");
        userService.changePassword(ok);
        assertEquals(true, encoder.matches("neu123456", user.getPassword()));
    }

    @Test
    void duplicateEmailCannotRegister() {
        when(userRepository.findByEmail("mo@test.de")).thenReturn(Optional.of(user));
        assertThrows(ResponseStatusException.class,
                () -> userService.registerUser(new UserRequest("Mo", "mo@test.de", "geheim1")));
    }
}
