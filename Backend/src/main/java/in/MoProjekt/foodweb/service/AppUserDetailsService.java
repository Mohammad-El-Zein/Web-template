package in.MoProjekt.foodweb.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;

import in.MoProjekt.foodweb.repository.UserRepository;
import in.MoProjekt.foodweb.entity.UserEntity;


@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_USER = "ROLE_USER";

    private final UserRepository userRepository;

    // Kommagetrennte Liste der Admin-E-Mails, auf Railway per ADMIN_EMAILS gesetzt
    @Value("${admin.emails}")
    private List<String> adminEmails;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return new User(user.getEmail(), user.getPassword(), getAuthorities(user.getEmail()));
    }

    public boolean isAdmin(String email) {
        return email != null && adminEmails.stream()
                .map(String::trim)
                .anyMatch(adminEmail -> !adminEmail.isEmpty() && adminEmail.equalsIgnoreCase(email.trim()));
    }

    private List<GrantedAuthority> getAuthorities(String email) {
        if (isAdmin(email)) {
            return List.of(new SimpleGrantedAuthority(ROLE_USER), new SimpleGrantedAuthority(ROLE_ADMIN));
        }
        return List.of(new SimpleGrantedAuthority(ROLE_USER));
    }
}
