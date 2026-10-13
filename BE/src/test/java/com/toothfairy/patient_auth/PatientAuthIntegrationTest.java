package com.toothfairy.patient_auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toothfairy.patient_auth.dto.PatientLoginRequest;
import com.toothfairy.patient_auth.dto.PatientRegisterRequest;
import com.toothfairy.stripe.StripeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test: boots full Spring context with H2, tests the
 * /api/patient-auth/* endpoints end-to-end (controller → service → repository).
 * StripeService is mocked to avoid external calls.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PatientAuthIntegrationTest {

    @Autowired MockMvc       mockMvc;
    @Autowired ObjectMapper  objectMapper;

    // Stub external dependency — no Stripe calls in patient auth, but the bean
    // must initialize; this prevents any accidental real network calls.
    @MockBean StripeService stripeService;

    private static final String BASE = "/api/patient-auth";

    // ── POST /register ────────────────────────────────────────────────────────

    @Test
    void register_validPayload_returns201WithTokenAndPatient() throws Exception {
        mockMvc.perform(post(BASE + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.patient.email").value("integrare@test.ro"))
                .andExpect(jsonPath("$.patient.firstName").value("Ana"))
                .andExpect(jsonPath("$.patient.lastName").value("Ion"))
                .andExpect(jsonPath("$.patient.phone").value("0721000099"));
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        String body = objectMapper.writeValueAsString(buildRegisterRequest());
        mockMvc.perform(post(BASE + "/register").contentType(MediaType.APPLICATION_JSON).content(body));

        mockMvc.perform(post(BASE + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void register_missingEmail_returns400() throws Exception {
        PatientRegisterRequest req = buildRegisterRequest();
        req.setEmail(null);
        mockMvc.perform(post(BASE + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_missingPassword_returns400() throws Exception {
        PatientRegisterRequest req = buildRegisterRequest();
        req.setPassword(null);
        mockMvc.perform(post(BASE + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── POST /login ───────────────────────────────────────────────────────────

    @Test
    void login_afterRegister_returns200WithToken() throws Exception {
        // Register first
        mockMvc.perform(post(BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildRegisterRequest())));

        // Then login
        PatientLoginRequest login = new PatientLoginRequest();
        login.setEmail("integrare@test.ro");
        login.setPassword("parola123");

        mockMvc.perform(post(BASE + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.patient.email").value("integrare@test.ro"));
    }

    @Test
    void login_emailCaseInsensitive_returns200() throws Exception {
        mockMvc.perform(post(BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildRegisterRequest())));

        PatientLoginRequest login = new PatientLoginRequest();
        login.setEmail("INTEGRARE@TEST.RO");
        login.setPassword("parola123");

        mockMvc.perform(post(BASE + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        mockMvc.perform(post(BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildRegisterRequest())));

        PatientLoginRequest login = new PatientLoginRequest();
        login.setEmail("integrare@test.ro");
        login.setPassword("parola_gresita");

        mockMvc.perform(post(BASE + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_unknownEmail_returns401() throws Exception {
        PatientLoginRequest login = new PatientLoginRequest();
        login.setEmail("nimeni@test.ro");
        login.setPassword("orice");

        mockMvc.perform(post(BASE + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /me ───────────────────────────────────────────────────────────────

    @Test
    void getMe_withValidToken_returns200WithProfile() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(get(BASE + "/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("integrare@test.ro"))
                .andExpect(jsonPath("$.firstName").value("Ana"));
    }

    @Test
    void getMe_withNoToken_returnsError() throws Exception {
        mockMvc.perform(get(BASE + "/me"))
                .andExpect(status().is5xxServerError());
    }

    @Test
    void getMe_withExpiredOrFakeToken_returns401() throws Exception {
        mockMvc.perform(get(BASE + "/me")
                        .header("Authorization", "Bearer totally.fake.token"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /bookings ─────────────────────────────────────────────────────────

    @Test
    void getBookings_withValidToken_returnsEmptyListWhenNone() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(get(BASE + "/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getBookings_withFakeToken_returns401() throws Exception {
        mockMvc.perform(get(BASE + "/bookings")
                        .header("Authorization", "Bearer fake.token.here"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getBookings_withNoAuthHeader_returnsError() throws Exception {
        mockMvc.perform(get(BASE + "/bookings"))
                .andExpect(status().is5xxServerError());
    }

    // ── Full flow: register → login → get bookings ────────────────────────────

    @Test
    void fullFlow_registerThenLoginThenGetBookings_allSucceed() throws Exception {
        // 1. Register
        mockMvc.perform(post(BASE + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterRequest())))
                .andExpect(status().isCreated());

        // 2. Login with same credentials
        PatientLoginRequest login = new PatientLoginRequest();
        login.setEmail("integrare@test.ro");
        login.setPassword("parola123");

        MvcResult loginResult = mockMvc.perform(post(BASE + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String loginJson = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(loginJson).get("token").asText();

        // 3. Use token to get bookings
        mockMvc.perform(get(BASE + "/bookings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PatientRegisterRequest buildRegisterRequest() {
        PatientRegisterRequest req = new PatientRegisterRequest();
        req.setEmail("integrare@test.ro");
        req.setPassword("parola123");
        req.setFirstName("Ana");
        req.setLastName("Ion");
        req.setPhone("0721000099");
        return req;
    }

    private String registerAndGetToken() throws Exception {
        MvcResult result = mockMvc.perform(post(BASE + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterRequest())))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }
}
