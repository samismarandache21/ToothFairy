package com.toothfairy.stripe;

import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeController {

    private final StripeService stripeService;

    // ── PUBLIC: Checkout Session anonim pentru înregistrare ──────────────────
    @PostMapping("/registration-session")
    public ResponseEntity<Map<String, String>> registrationSession(@RequestBody Map<String, String> body) {
        try {
            String url = stripeService.createRegistrationCheckoutSession(
                    body.get("successUrl"), body.get("cancelUrl"));
            return ResponseEntity.ok(Map.of("sessionUrl", url));
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Checkout Session pentru adăugare card în setări ───────────
    @PostMapping("/add-card-session")
    public ResponseEntity<Map<String, String>> addCardSession(@RequestBody Map<String, String> body) {
        try {
            String url = stripeService.createAddCardCheckoutSession(
                    body.get("successUrl"), body.get("cancelUrl"));
            return ResponseEntity.ok(Map.of("sessionUrl", url));
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Finalizare add-card după revenire din Stripe ─────────────
    @PostMapping("/add-card-finalize")
    public ResponseEntity<Void> finalizeAddCard(@RequestBody Map<String, String> body) {
        try {
            stripeService.finalizeAddCardSession(body.get("sessionId"));
            return ResponseEntity.ok().build();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PUBLIC: Setup intent anonim (păstrat pentru compatibilitate) ─────────
    @PostMapping("/setup-intent")
    public ResponseEntity<Map<String, String>> setupIntent() {
        try {
            String clientSecret = stripeService.createAnonymousSetupIntent();
            return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: SetupIntent pentru customer existent (compatibilitate) ────
    @PostMapping("/payment-methods/setup-intent")
    public ResponseEntity<Map<String, String>> customerSetupIntent() {
        try {
            String clientSecret = stripeService.createCustomerSetupIntent();
            return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Lista carduri ─────────────────────────────────────────────
    @GetMapping("/payment-methods")
    public ResponseEntity<List<StripeService.PaymentMethodDto>> getPaymentMethods() {
        try {
            return ResponseEntity.ok(stripeService.getPaymentMethods());
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Setare card implicit ─────────────────────────────────────
    @PutMapping("/payment-methods/{pmId}/default")
    public ResponseEntity<Void> setDefault(@PathVariable String pmId) {
        try {
            stripeService.setDefaultPaymentMethod(pmId);
            return ResponseEntity.ok().build();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Eliminare card ────────────────────────────────────────────
    @DeleteMapping("/payment-methods/{pmId}")
    public ResponseEntity<Void> detachCard(@PathVariable String pmId) {
        try {
            stripeService.detachPaymentMethod(pmId);
            return ResponseEntity.ok().build();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Info abonament curent ─────────────────────────────────────
    @GetMapping("/subscription")
    public ResponseEntity<StripeService.SubscriptionDto> getSubscription() {
        try {
            return ResponseEntity.ok(stripeService.getSubscription());
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Schimbare plan ─────────────────────────────────────────────
    @PutMapping("/subscription/plan")
    public ResponseEntity<Void> changePlan(@RequestBody Map<String, String> body) {
        String newPlan = body.get("plan");
        if (newPlan == null || !List.of("starter", "pro", "clinic").contains(newPlan)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan invalid.");
        }
        try {
            stripeService.changePlan(newPlan);
            return ResponseEntity.ok().build();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
