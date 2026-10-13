package com.toothfairy.auth;

import com.toothfairy.auth.dto.LoginRequest;
import com.toothfairy.auth.dto.RegisterRequest;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.stripe.StripeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock CabinetRepository cabinetRepository;
    @Mock PasswordEncoder   passwordEncoder;
    @Mock JwtService        jwtService;
    @Mock StripeService     stripeService;

    @InjectMocks AuthService authService;

    private Cabinet cabinet;

    @BeforeEach
    void setup() {
        cabinet = Cabinet.builder()
                .id(UUID.randomUUID())
                .email("doc@clinic.ro")
                .password("hashed_pw")
                .firstName("Ion")
                .lastName("Pop")
                .name("Clinica Pop")
                .plan("starter")
                .smsCredits(50)
                .build();
    }

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_newEmail_savesAndReturnsToken() {
        RegisterRequest req = buildRegisterRequest();
        when(cabinetRepository.existsByEmail("doc@clinic.ro")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pw");
        when(cabinetRepository.save(any())).thenReturn(cabinet);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("jwt_token");

        var result = authService.register(req);

        assertThat(result.getToken()).isEqualTo("jwt_token");
        assertThat(result.getCabinet().getEmail()).isEqualTo("doc@clinic.ro");
        verify(cabinetRepository).save(any(Cabinet.class));
    }

    @Test
    void register_duplicateEmail_throws409() {
        RegisterRequest req = buildRegisterRequest();
        when(cabinetRepository.existsByEmail("doc@clinic.ro")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(409);

        verify(cabinetRepository, never()).save(any());
    }

    @Test
    void register_emailNormalized_toLowerCase() {
        RegisterRequest req = buildRegisterRequest();
        req.setEmail("DOC@CLINIC.RO");
        when(cabinetRepository.existsByEmail("doc@clinic.ro")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(cabinetRepository.save(any())).thenReturn(cabinet);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("tok");

        authService.register(req);

        verify(cabinetRepository).existsByEmail("doc@clinic.ro");
    }

    @Test
    void register_nullPlan_defaultsToStarter() {
        RegisterRequest req = buildRegisterRequest();
        req.setPlan(null);
        when(cabinetRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        // Capture the saved Cabinet to verify plan
        when(cabinetRepository.save(argThat(c -> "starter".equals(c.getPlan()))))
                .thenReturn(cabinet);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("tok");

        authService.register(req);

        verify(cabinetRepository).save(argThat(c -> "starter".equals(c.getPlan())));
    }

    @Test
    void register_withStripeSessionId_fetchesPaymentMethod() throws Exception {
        RegisterRequest req = buildRegisterRequest();
        req.setStripeSessionId("cs_test_123");
        when(cabinetRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(cabinetRepository.save(any())).thenReturn(cabinet);
        when(stripeService.getPaymentMethodFromSession("cs_test_123")).thenReturn("pm_123");
        when(jwtService.generateToken(any(), any(), any())).thenReturn("tok");

        authService.register(req);

        verify(stripeService).getPaymentMethodFromSession("cs_test_123");
        verify(stripeService).createCustomerAndSubscribe(any(), eq("pm_123"));
    }

    @Test
    void register_stripeSessionError_deletesAndThrows400() throws Exception {
        RegisterRequest req = buildRegisterRequest();
        req.setStripeSessionId("cs_bad");
        when(cabinetRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(cabinetRepository.save(any())).thenReturn(cabinet);
        when(stripeService.getPaymentMethodFromSession("cs_bad"))
                .thenThrow(new RuntimeException("Stripe error"));

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(400);

        verify(cabinetRepository).delete(cabinet);
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_correctCredentials_returnsToken() {
        LoginRequest req = new LoginRequest();
        req.setEmail("doc@clinic.ro");
        req.setPassword("password123");

        when(cabinetRepository.findByEmail("doc@clinic.ro")).thenReturn(Optional.of(cabinet));
        when(passwordEncoder.matches("password123", "hashed_pw")).thenReturn(true);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("jwt_token");

        var result = authService.login(req);

        assertThat(result.getToken()).isEqualTo("jwt_token");
    }

    @Test
    void login_emailNotFound_throws401() {
        LoginRequest req = new LoginRequest();
        req.setEmail("unknown@x.ro");
        req.setPassword("pass");

        when(cabinetRepository.findByEmail("unknown@x.ro")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void login_wrongPassword_throws401() {
        LoginRequest req = new LoginRequest();
        req.setEmail("doc@clinic.ro");
        req.setPassword("wrong");

        when(cabinetRepository.findByEmail("doc@clinic.ro")).thenReturn(Optional.of(cabinet));
        when(passwordEncoder.matches("wrong", "hashed_pw")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void login_emailNormalized_toLowerCase() {
        LoginRequest req = new LoginRequest();
        req.setEmail("DOC@CLINIC.RO");
        req.setPassword("pass");

        when(cabinetRepository.findByEmail("doc@clinic.ro")).thenReturn(Optional.of(cabinet));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("tok");

        authService.login(req);

        verify(cabinetRepository).findByEmail("doc@clinic.ro");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private RegisterRequest buildRegisterRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setFirstName("Ion");
        req.setLastName("Pop");
        req.setCabinetName("Clinica Pop");
        req.setEmail("doc@clinic.ro");
        req.setPassword("password123");
        req.setPhone("0721000000");
        req.setPlan("starter");
        return req;
    }
}
