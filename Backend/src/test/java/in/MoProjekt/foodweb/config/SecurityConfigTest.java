package in.MoProjekt.foodweb.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import in.MoProjekt.foodweb.controller.AdminController;
import in.MoProjekt.foodweb.controller.AdminOrderController;
import in.MoProjekt.foodweb.controller.AdminSettingsController;
import in.MoProjekt.foodweb.controller.AiController;
import in.MoProjekt.foodweb.controller.FoodController;
import in.MoProjekt.foodweb.controller.OrderController;
import in.MoProjekt.foodweb.controller.SiteSettingsController;
import in.MoProjekt.foodweb.controller.UserController;
import in.MoProjekt.foodweb.entity.FoodImageEntity;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity;
import in.MoProjekt.foodweb.entity.UserEntity;
import in.MoProjekt.foodweb.exception.OrderRejectedException;
import in.MoProjekt.foodweb.exception.SettingsValidationException;
import in.MoProjekt.foodweb.filters.JwtAuthenticationFilter;
import in.MoProjekt.foodweb.io.NutritionResponse;
import in.MoProjekt.foodweb.repository.OrderRepository;
import in.MoProjekt.foodweb.repository.UserRepository;
import in.MoProjekt.foodweb.service.AppUserDetailsService;
import in.MoProjekt.foodweb.service.FoodService;
import in.MoProjekt.foodweb.service.NutritionService;
import in.MoProjekt.foodweb.service.OrderService;
import in.MoProjekt.foodweb.service.PaymentService;
import in.MoProjekt.foodweb.service.RateLimiter;
import in.MoProjekt.foodweb.service.SiteSettingsDefaults;
import in.MoProjekt.foodweb.service.SiteSettingsService;
import in.MoProjekt.foodweb.service.UserService;
import in.MoProjekt.foodweb.io.ProfileResponse;
import in.MoProjekt.foodweb.util.JwtUtil;

@WebMvcTest(controllers = { FoodController.class, AdminOrderController.class, AiController.class, AdminController.class, UserController.class,
        SiteSettingsController.class, AdminSettingsController.class, OrderController.class })
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, JwtUtil.class, AppUserDetailsService.class, RateLimiter.class })
@TestPropertySource(properties = {
        "jwt.secret.key=dGVzdFNlY3JldEtleUZvclVuaXRUZXN0c09ubHlOb3RQcm9kdWN0aW9uMTIzNDU2",
        "admin.emails=admin@test.de",
        "cors.allowed-origins=https://admin.example.com",
        "nutrition.rate-limit.per-ip=2",
        "nutrition.rate-limit.global=100"
})
class SecurityConfigTest {

    @Autowired private MockMvc mvc;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private AppUserDetailsService userDetailsService;

    @MockitoBean private UserRepository userRepository;
    @MockitoBean private FoodService foodService;
    @MockitoBean private OrderService orderService;
    @MockitoBean private NutritionService nutritionService;
    @MockitoBean private UserService userService;
    @MockitoBean private SiteSettingsService siteSettingsService;
    @MockitoBean private PaymentService paymentService;
    @MockitoBean private OrderRepository orderRepository;

    @BeforeEach
    void setUp() throws Exception {
        when(userRepository.findByEmail("admin@test.de"))
                .thenReturn(Optional.of(UserEntity.builder().email("admin@test.de").password("x").build()));
        when(userRepository.findByEmail("user@test.de"))
                .thenReturn(Optional.of(UserEntity.builder().email("user@test.de").password("x").build()));
        when(foodService.readFoods(any())).thenReturn(List.of());
        when(orderService.getAllOrders()).thenReturn(List.of());
        when(nutritionService.analyze(any())).thenReturn(new NutritionResponse());
    }

    private String token(String email) {
        UserDetails details = userDetailsService.loadUserByUsername(email);
        return "Bearer " + jwtUtil.generateToken(details);
    }

    @Test
    void foodsAreReadableByEveryone() throws Exception {
        mvc.perform(get("/api/foods")).andExpect(status().isOk());
        mvc.perform(get("/api/foods").header("Authorization", "Bearer kaputt")).andExpect(status().isOk());
        when(foodService.readImage("img1")).thenReturn(FoodImageEntity.builder().contentType("image/jpeg").data(new byte[] { 1 }).build());
        mvc.perform(get("/api/foods/images/img1")).andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"));
    }

    @Test
    void onlyAdminsCanDeleteFoods() throws Exception {
        mvc.perform(delete("/api/foods/1")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/foods/1").header("Authorization", token("user@test.de"))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/foods/1").header("Authorization", token("admin@test.de"))).andExpect(status().isNoContent());
    }

    @Test
    void onlyAdminsCanSeeAllOrders() throws Exception {
        mvc.perform(get("/api/admin/orders")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/orders").header("Authorization", token("user@test.de"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/orders").header("Authorization", token("admin@test.de"))).andExpect(status().isOk());
    }

    @Test
    void onlyAdminsCanEditFoodsAndTranslate() throws Exception {
        String body = "{\"text\":\"Pizza\"}";
        mvc.perform(put("/api/foods/1")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/translate").header("Authorization", token("user@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        when(foodService.translate("Pizza")).thenReturn(java.util.Map.of("de", "Pizza", "ar", "بيتزا"));
        mvc.perform(post("/api/admin/translate").header("Authorization", token("admin@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ar").value("بيتزا"));
    }

    @Test
    void profileNeedsLogin() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
        when(userService.getProfile()).thenReturn(ProfileResponse.builder().email("user@test.de").role("USER").build());
        mvc.perform(get("/api/me").header("Authorization", token("user@test.de")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void nutritionIsValidatedAndRateLimited() throws Exception {
        String valid = "{\"foodName\":\"Pizza\",\"portion\":300}";
        mvc.perform(post("/api/nutrition/analyze").contentType(MediaType.APPLICATION_JSON)
                .content("{\"foodName\":\"Pizza\",\"portion\":99999}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/nutrition/analyze").contentType(MediaType.APPLICATION_JSON).content(valid)).andExpect(status().isOk());
        mvc.perform(post("/api/nutrition/analyze").contentType(MediaType.APPLICATION_JSON).content(valid)).andExpect(status().isOk());
        mvc.perform(post("/api/nutrition/analyze").contentType(MediaType.APPLICATION_JSON).content(valid)).andExpect(status().isTooManyRequests());
    }

    @Test
    void settingsAreReadableByEveryone() throws Exception {
        when(siteSettingsService.getSettings()).thenReturn(SiteSettingsDefaults.create(2025));
        mvc.perform(get("/api/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantName").value("FlavorHaus"))
                .andExpect(jsonPath("$.primaryColor").value("#9a401c"))
                .andExpect(jsonPath("$.ordering.ordersOnlyDuringOpeningHours").value(false))
                .andExpect(jsonPath("$.openingHours.days.MONDAY[0].open").value("11:00"))
                .andExpect(jsonPath("$.id").doesNotExist());
        mvc.perform(get("/api/settings").header("Authorization", "Bearer kaputt")).andExpect(status().isOk());
    }

    @Test
    void onlyAdminsCanChangeSettings() throws Exception {
        String body = "{\"restaurantName\":\"Neu\"}";
        when(siteSettingsService.updateSettings(any())).thenReturn(SiteSettingsEntity.builder().restaurantName("Neu").build());
        mvc.perform(put("/api/admin/settings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/admin/settings").header("Authorization", token("user@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/settings").header("Authorization", token("admin@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantName").value("Neu"));
        // PUT auf den öffentlichen Pfad ist nicht erlaubt
        mvc.perform(put("/api/settings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidSettingsReturnJsonError() throws Exception {
        when(siteSettingsService.updateSettings(any()))
                .thenThrow(new SettingsValidationException("primaryColor", "Color must be a hex value like #9a401c"));
        mvc.perform(put("/api/admin/settings").header("Authorization", token("admin@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"primaryColor\":\"rot\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SETTINGS_INVALID"))
                .andExpect(jsonPath("$.field").value("primaryColor"))
                .andExpect(jsonPath("$.message").value("Color must be a hex value like #9a401c"));
    }

    @Test
    void rejectedOrdersReturnJsonError() throws Exception {
        String body = "{\"orderedItems\":[{\"foodId\":\"p1\",\"quantity\":1}]}";
        when(orderService.createOrderWithPayment(any())).thenThrow(new OrderRejectedException(
                OrderRejectedException.MIN_ORDER_NOT_REACHED, "Minimum order amount is 15.00 EUR",
                java.util.Map.of("minOrderAmount", 15.0)));
        mvc.perform(post("/api/orders/create").header("Authorization", token("user@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MIN_ORDER_NOT_REACHED"))
                .andExpect(jsonPath("$.message").value("Minimum order amount is 15.00 EUR"))
                .andExpect(jsonPath("$.minOrderAmount").value(15.0));

        org.mockito.Mockito.doThrow(
                new OrderRejectedException(OrderRejectedException.RESTAURANT_CLOSED, "Restaurant is currently closed"))
                .when(orderService).createOrderWithPayment(any());
        mvc.perform(post("/api/orders/create").header("Authorization", token("user@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RESTAURANT_CLOSED"))
                .andExpect(jsonPath("$.minOrderAmount").doesNotExist());
    }

    @Test
    void corsAllowsConfiguredOrigin() throws Exception {
        mvc.perform(options("/api/admin/orders")
                .header("Origin", "https://admin.example.com")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://admin.example.com"));
        mvc.perform(options("/api/admin/orders")
                .header("Origin", "https://evil.example.com")
                .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
