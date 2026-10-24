package in.MoProjekt.foodweb.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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

import in.MoProjekt.foodweb.controller.AdminCategoryController;
import in.MoProjekt.foodweb.controller.AdminController;
import in.MoProjekt.foodweb.controller.AdminImageController;
import in.MoProjekt.foodweb.exception.ImageException;
import in.MoProjekt.foodweb.storage.ImageStorage;
import org.springframework.mock.web.MockMultipartFile;
import in.MoProjekt.foodweb.controller.CategoryController;
import in.MoProjekt.foodweb.exception.CategoryException;
import in.MoProjekt.foodweb.io.CategoryResponse;
import in.MoProjekt.foodweb.service.CategoryService;
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
        SiteSettingsController.class, AdminSettingsController.class, OrderController.class,
        CategoryController.class, AdminCategoryController.class, AdminImageController.class })
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
    @MockitoBean private CategoryService categoryService;
    @MockitoBean private ImageStorage imageStorage;

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
    void categoriesAreReadableByEveryone() throws Exception {
        when(categoryService.readActiveCategories("ar")).thenReturn(List.of(CategoryResponse.builder()
                .id("c7").slug("getraenke").name(java.util.Map.of("ar", "مشروبات")).sortOrder(6).active(true).build()));
        mvc.perform(get("/api/categories").param("lang", "ar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("getraenke"))
                .andExpect(jsonPath("$[0].name.ar").value("مشروبات"));
        mvc.perform(get("/api/categories").header("Authorization", "Bearer kaputt")).andExpect(status().isOk());
        // Schreiben über den öffentlichen Pfad ist nicht erlaubt
        mvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void onlyAdminsCanManageCategories() throws Exception {
        String body = "{\"name\":{\"de\":\"Suppen\"}}";
        when(categoryService.readAllCategories()).thenReturn(List.of());
        when(categoryService.addCategory(any())).thenReturn(CategoryResponse.builder().id("c8").slug("suppen").build());
        when(categoryService.updateCategory(eq("c8"), any())).thenReturn(CategoryResponse.builder().id("c8").build());
        when(categoryService.reorder(any())).thenReturn(List.of());

        mvc.perform(get("/api/admin/categories")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/categories").header("Authorization", token("user@test.de"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/categories").header("Authorization", token("admin@test.de"))).andExpect(status().isOk());

        mvc.perform(post("/api/admin/categories").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/categories").header("Authorization", token("user@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/categories").header("Authorization", token("admin@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("suppen"));

        mvc.perform(put("/api/admin/categories/c8").header("Authorization", token("user@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/categories/c8").header("Authorization", token("admin@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());

        mvc.perform(put("/api/admin/categories/order").contentType(MediaType.APPLICATION_JSON).content("[\"c8\"]"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/admin/categories/order").header("Authorization", token("admin@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content("[\"c8\",\"c1\"]")).andExpect(status().isOk());
        verify(categoryService).reorder(List.of("c8", "c1"));

        mvc.perform(delete("/api/admin/categories/c8")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/categories/c8").header("Authorization", token("user@test.de"))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/admin/categories/c8").header("Authorization", token("admin@test.de"))).andExpect(status().isNoContent());
    }

    @Test
    void categoryErrorsReturnJson() throws Exception {
        org.mockito.Mockito.doThrow(CategoryException.notEmpty(3)).when(categoryService).deleteCategory("c1");
        mvc.perform(delete("/api/admin/categories/c1").header("Authorization", token("admin@test.de")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CATEGORY_NOT_EMPTY"))
                .andExpect(jsonPath("$.foodCount").value(3))
                .andExpect(jsonPath("$.message").value("Category still has 3 foods"));

        when(categoryService.addCategory(any())).thenThrow(CategoryException.invalid("name.de", "German name is required"));
        mvc.perform(post("/api/admin/categories").header("Authorization", token("admin@test.de"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":{\"en\":\"Soups\"}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CATEGORY_INVALID"))
                .andExpect(jsonPath("$.field").value("name.de"));
    }

    private final MockMultipartFile image = new MockMultipartFile("file", "logo.png", "image/png",
            new byte[] { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A });

    @Test
    void onlyAdminsCanUploadImages() throws Exception {
        when(imageStorage.upload(any(), eq("site"))).thenReturn("https://img.example.com/flavorhaus/site/a.png");
        when(imageStorage.upload(any(), eq("categories"))).thenReturn("https://img.example.com/flavorhaus/categories/b.png");

        mvc.perform(multipart("/api/admin/images").file(image)).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/admin/images").file(image).header("Authorization", token("user@test.de")))
                .andExpect(status().isForbidden());
        // Ohne folder -> "site"
        mvc.perform(multipart("/api/admin/images").file(image).header("Authorization", token("admin@test.de")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://img.example.com/flavorhaus/site/a.png"));
        mvc.perform(multipart("/api/admin/images").file(image).param("folder", "categories")
                .header("Authorization", token("admin@test.de")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://img.example.com/flavorhaus/categories/b.png"));
    }

    @Test
    void invalidImagesReturnJsonError() throws Exception {
        mvc.perform(multipart("/api/admin/images").file(image).param("folder", "geheim")
                .header("Authorization", token("admin@test.de")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("IMAGE_INVALID"))
                .andExpect(jsonPath("$.field").value("folder"));
        mvc.perform(multipart("/api/admin/images").header("Authorization", token("admin@test.de")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("IMAGE_INVALID"))
                .andExpect(jsonPath("$.field").value("file"));

        when(imageStorage.upload(any(), any())).thenThrow(ImageException.tooLarge(5L * 1024 * 1024));
        mvc.perform(multipart("/api/admin/images").file(image).header("Authorization", token("admin@test.de")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("IMAGE_TOO_LARGE"))
                .andExpect(jsonPath("$.maxBytes").value(5242880));
        org.mockito.Mockito.verify(imageStorage, org.mockito.Mockito.times(1)).upload(any(), any());
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
