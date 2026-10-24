package in.MoProjekt.foodweb.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Eigene Uhr als Bean, damit Tests die Uhrzeit festlegen können (Öffnungszeiten)
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
