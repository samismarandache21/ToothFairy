package com.toothfairy.auth;

import com.toothfairy.config.JwtConfig;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtServiceTest {

    // Secret must be ≥ 256 bits (32 chars) for HMAC-SHA256
    private static final String SECRET = "toothfairy-test-secret-key-1234567890abcdef";
    private static final long   EXP    = 3_600_000L; // 1 hour

    @Mock  JwtConfig jwtConfig;
    @InjectMocks JwtService jwtService;

    @BeforeEach
    void setup() {
        when(jwtConfig.getSecret()).thenReturn(SECRET);
        when(jwtConfig.getExpiration()).thenReturn(EXP);
    }

    @Test
    void generateToken_returnsNonNullToken() {
        String token = jwtService.generateToken(UUID.randomUUID(), "test@email.com", "starter");
        assertThat(token).isNotBlank();
    }

    @Test
    void extractCabinetId_roundTrip() {
        UUID id    = UUID.randomUUID();
        String tok = jwtService.generateToken(id, "doc@clinic.ro", "pro");
        assertThat(jwtService.extractCabinetId(tok)).isEqualTo(id);
    }

    @Test
    void extractEmail_roundTrip() {
        String email = "doc@clinic.ro";
        String tok   = jwtService.generateToken(UUID.randomUUID(), email, "starter");
        assertThat(jwtService.extractEmail(tok)).isEqualTo(email);
    }

    @Test
    void isTokenValid_freshToken_returnsTrue() {
        String tok = jwtService.generateToken(UUID.randomUUID(), "doc@c.ro", "starter");
        assertThat(jwtService.isTokenValid(tok)).isTrue();
    }

    @Test
    void isTokenValid_expiredToken_returnsFalse() {
        // Build an already-expired token manually
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String tok = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("email", "x@y.com")
                .claim("plan", "starter")
                .issuedAt(new Date(System.currentTimeMillis() - 10_000))
                .expiration(new Date(System.currentTimeMillis() - 5_000)) // expired 5 s ago
                .signWith(key)
                .compact();
        assertThat(jwtService.isTokenValid(tok)).isFalse();
    }

    @Test
    void isTokenValid_patientTypeClaim_returnsFalse() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String tok = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("type", "patient")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXP))
                .signWith(key)
                .compact();
        assertThat(jwtService.isTokenValid(tok)).isFalse();
    }

    @Test
    void isTokenValid_malformedToken_returnsFalse() {
        assertThat(jwtService.isTokenValid("not.a.jwt")).isFalse();
    }

    @Test
    void isTokenValid_nullToken_returnsFalse() {
        assertThat(jwtService.isTokenValid(null)).isFalse();
    }

    @Test
    void generateToken_differentCallsProduceDifferentTokens() {
        String tok1 = jwtService.generateToken(UUID.randomUUID(), "a@b.com", "starter");
        String tok2 = jwtService.generateToken(UUID.randomUUID(), "c@d.com", "pro");
        assertThat(tok1).isNotEqualTo(tok2);
    }
}
