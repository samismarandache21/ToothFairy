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
@RequestMapping("/api/stripe/clinic")
@RequiredArgsConstructor
public class StripeClinicController {

    private final StripeClinicService stripeClinicService;

    // ── PUBLIC: Checkout Session anonim pentru înregistrare clinică ───────────
    @PostMapping("/registration-session")
    public ResponseEntity<Map<String, String>> registrationSession(@RequestBody Map<String, String> body) {
        try {
            String url = stripeClinicService.createRegistrationCheckoutSession(
                    body.get("successUrl"), body.get("cancelUrl"));
            return ResponseEntity.ok(Map.of("sessionUrl", url));
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Checkout Session pentru adăugare card ─────────────────────
    @PostMapping("/add-card-session")
    public ResponseEntity<Map<String, String>> addCardSession(@RequestBody Map<String, String> body) {
        try {
            String url = stripeClinicService.createAddCardCheckoutSession(
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
            stripeClinicService.finalizeAddCardSession(body.get("sessionId"));
            return ResponseEntity.ok().build();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Lista carduri ──────────────────────────────────────────────
    @GetMapping("/payment-methods")
    public ResponseEntity<List<StripeService.PaymentMethodDto>> getPaymentMethods() {
        try {
            return ResponseEntity.ok(stripeClinicService.getPaymentMethods());
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Setare card implicit ──────────────────────────────────────
    @PutMapping("/payment-methods/{pmId}/default")
    public ResponseEntity<Void> setDefault(@PathVariable String pmId) {
        try {
            stripeClinicService.setDefaultPaymentMethod(pmId);
            return ResponseEntity.ok().build();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Eliminare card ─────────────────────────────────────────────
    @DeleteMapping("/payment-methods/{pmId}")
    public ResponseEntity<Void> detachCard(@PathVariable String pmId) {
        try {
            stripeClinicService.detachPaymentMethod(pmId);
            return ResponseEntity.ok().build();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ── PROTECTED: Info abonament curent ──────────────────────────────────────
    @GetMapping("/subscription")
    public ResponseEntity<StripeService.SubscriptionDto> getSubscription() {
        try {
            return ResponseEntity.ok(stripeClinicService.getSubscription());
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
