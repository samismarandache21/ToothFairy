package com.toothfairy.stripe;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentMethod;
import com.stripe.model.PaymentMethodCollection;
import com.stripe.model.SetupIntent;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.CustomerUpdateParams;
import com.stripe.param.PaymentMethodListParams;
import com.stripe.param.SetupIntentCreateParams;
import com.stripe.param.SubscriptionCreateParams;
import com.stripe.param.SubscriptionUpdateParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StripeService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    private final CabinetRepository cabinetRepository;
    private final SecurityUtils     securityUtils;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    // ── Checkout Session pentru adăugare card (AUTH, redirect Stripe) ────────
    public String createAddCardCheckoutSession(String successUrl, String cancelUrl)
            throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        if (cabinet.getStripeCustomerId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Contul nu are un profil de plată Stripe.");
        }
        Session session = Session.create(SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SETUP)
                .setCustomer(cabinet.getStripeCustomerId())
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .build());
        return session.getUrl();
    }

    // ── Finalizare add-card: setează PM ca implicit dacă nu există altul ─────
    public void finalizeAddCardSession(String sessionId) throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        Session session = Session.retrieve(sessionId);
        SetupIntent si = SetupIntent.retrieve(session.getSetupIntent());
        String pmId = si.getPaymentMethod();
        if (pmId == null) return;

        Customer customer = Customer.retrieve(cabinet.getStripeCustomerId());
        boolean hasDefault = customer.getInvoiceSettings() != null
                && customer.getInvoiceSettings().getDefaultPaymentMethod() != null;
        if (!hasDefault) {
            setDefaultPaymentMethodDirect(cabinet.getStripeCustomerId(),
                    cabinet.getStripeSubscriptionId(), pmId);
        }
    }

    // ── Checkout Session anonim pentru înregistrare (PUBLIC) ─────────────────
    public String createRegistrationCheckoutSession(String successUrl, String cancelUrl)
            throws StripeException {
        Session session = Session.create(SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SETUP)
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .build());
        return session.getUrl();
    }

    // ── Obține PaymentMethod ID dintr-o sesiune Checkout completată ───────────
    public String getPaymentMethodFromSession(String sessionId) throws StripeException {
        Session session = Session.retrieve(sessionId);
        SetupIntent si = SetupIntent.retrieve(session.getSetupIntent());
        return si.getPaymentMethod();
    }

    // ── SetupIntent anonim (păstrat pentru compatibilitate) ──────────────────
    public String createAnonymousSetupIntent() throws StripeException {
        SetupIntentCreateParams params = SetupIntentCreateParams.builder()
                .addPaymentMethodType("card")
                .build();
        return SetupIntent.create(params).getClientSecret();
    }

    // ── SetupIntent legat de customer (păstrat pentru compatibilitate) ───────
    public String createCustomerSetupIntent() throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        if (cabinet.getStripeCustomerId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Contul nu are un profil de plată Stripe.");
        }
        SetupIntentCreateParams params = SetupIntentCreateParams.builder()
                .setCustomer(cabinet.getStripeCustomerId())
                .addPaymentMethodType("card")
                .build();
        return SetupIntent.create(params).getClientSecret();
    }

    // ── Creare customer + abonament (apelat din AuthService la înregistrare) ─
    public void createCustomerAndSubscribe(Cabinet cabinet, String paymentMethodId)
            throws StripeException {

        // 1. Creare customer Stripe cu PM implicit
        CustomerCreateParams.InvoiceSettings invoiceSettings =
                CustomerCreateParams.InvoiceSettings.builder()
                        .setDefaultPaymentMethod(paymentMethodId)
                        .build();

        CustomerCreateParams cp = CustomerCreateParams.builder()
                .setEmail(cabinet.getEmail())
                .setName(cabinet.getFirstName() + " " + cabinet.getLastName())
                .setPaymentMethod(paymentMethodId)
                .setInvoiceSettings(invoiceSettings)
                .build();
        Customer customer = Customer.create(cp);

        // 2. Creare abonament lunar cu prețul planului ales
        Subscription sub = createSubscription(customer.getId(), paymentMethodId, cabinet.getPlan());

        // 3. Actualizare entitate (salvată de apelant)
        cabinet.setStripeCustomerId(customer.getId());
        cabinet.setStripeSubscriptionId(sub.getId());
        cabinet.setSubscriptionStatus(sub.getStatus());
    }

    // ── Lista carduri ale cabinetului curent ─────────────────────────────────
    public List<PaymentMethodDto> getPaymentMethods() throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        if (cabinet.getStripeCustomerId() == null) return List.of();

        Customer customer = Customer.retrieve(cabinet.getStripeCustomerId());
        String defaultPmId = (customer.getInvoiceSettings() != null)
                ? customer.getInvoiceSettings().getDefaultPaymentMethod()
                : null;

        PaymentMethodListParams params = PaymentMethodListParams.builder()
                .setCustomer(cabinet.getStripeCustomerId())
                .setType(PaymentMethodListParams.Type.CARD)
                .build();
        PaymentMethodCollection pms = PaymentMethod.list(params);

        return pms.getData().stream().map(pm -> new PaymentMethodDto(
                pm.getId(),
                pm.getCard().getBrand(),
                pm.getCard().getLast4(),
                pm.getCard().getExpMonth(),
                pm.getCard().getExpYear(),
                pm.getId().equals(defaultPmId)
        )).toList();
    }

    // ── Detașare card ────────────────────────────────────────────────────────
    public void detachPaymentMethod(String pmId) throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        PaymentMethod pm = PaymentMethod.retrieve(pmId);
        if (pm.getCustomer() == null || !pm.getCustomer().equals(cabinet.getStripeCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cardul nu aparține acestui cabinet.");
        }
        pm.detach();
    }

    // ── Setare card implicit (public, folosește cabinet curent) ─────────────
    public void setDefaultPaymentMethod(String pmId) throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        if (cabinet.getStripeCustomerId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cabinet fără profil Stripe.");
        }
        setDefaultPaymentMethodDirect(cabinet.getStripeCustomerId(),
                cabinet.getStripeSubscriptionId(), pmId);
    }

    // ── Helper privat: setare default cu IDs explicite ───────────────────────
    private void setDefaultPaymentMethodDirect(String customerId, String subscriptionId, String pmId)
            throws StripeException {
        CustomerUpdateParams.InvoiceSettings invoiceSettings =
                CustomerUpdateParams.InvoiceSettings.builder()
                        .setDefaultPaymentMethod(pmId)
                        .build();
        Customer.retrieve(customerId).update(
                CustomerUpdateParams.builder().setInvoiceSettings(invoiceSettings).build());

        if (subscriptionId != null) {
            Subscription.retrieve(subscriptionId).update(
                    SubscriptionUpdateParams.builder()
                            .setDefaultPaymentMethod(pmId)
                            .build());
        }
    }

    // ── Info abonament curent ────────────────────────────────────────────────
    public SubscriptionDto getSubscription() throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        if (cabinet.getStripeSubscriptionId() == null) {
            return new SubscriptionDto(cabinet.getPlan(), "no_subscription", null, null);
        }
        Subscription sub = Subscription.retrieve(cabinet.getStripeSubscriptionId());
        return new SubscriptionDto(
                cabinet.getPlan(),
                sub.getStatus(),
                sub.getCurrentPeriodEnd(),
                sub.getCurrentPeriodStart()
        );
    }

    // ── Schimbare plan ───────────────────────────────────────────────────────
    public void changePlan(String newPlan) throws StripeException {
        Cabinet cabinet = getCurrentCabinet();
        if (cabinet.getStripeSubscriptionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Niciun abonament activ.");
        }

        Subscription sub = Subscription.retrieve(cabinet.getStripeSubscriptionId());
        String itemId = sub.getItems().getData().get(0).getId();

        SubscriptionUpdateParams.Item.PriceData.Recurring recurring =
                SubscriptionUpdateParams.Item.PriceData.Recurring.builder()
                        .setInterval(SubscriptionUpdateParams.Item.PriceData.Recurring.Interval.MONTH)
                        .build();

        SubscriptionUpdateParams.Item.PriceData priceData =
                SubscriptionUpdateParams.Item.PriceData.builder()
                        .setCurrency("ron")
                        .setUnitAmount(planAmount(newPlan))
                        .setRecurring(recurring)
                        .setProduct(ensureProduct(newPlan))
                        .build();

        SubscriptionUpdateParams.Item item = SubscriptionUpdateParams.Item.builder()
                .setId(itemId)
                .setPriceData(priceData)
                .build();

        sub.update(SubscriptionUpdateParams.builder().addItem(item).build());

        cabinet.setPlan(newPlan);
        cabinetRepository.save(cabinet);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Subscription createSubscription(String customerId, String pmId, String plan)
            throws StripeException {

        SubscriptionCreateParams.Item.PriceData.Recurring recurring =
                SubscriptionCreateParams.Item.PriceData.Recurring.builder()
                        .setInterval(SubscriptionCreateParams.Item.PriceData.Recurring.Interval.MONTH)
                        .build();

        SubscriptionCreateParams.Item.PriceData priceData =
                SubscriptionCreateParams.Item.PriceData.builder()
                        .setCurrency("ron")
                        .setUnitAmount(planAmount(plan))
                        .setRecurring(recurring)
                        .setProduct(ensureProduct(plan))
                        .build();

        SubscriptionCreateParams.Item item = SubscriptionCreateParams.Item.builder()
                .setPriceData(priceData)
                .build();

        return Subscription.create(
                SubscriptionCreateParams.builder()
                        .setCustomer(customerId)
                        .addItem(item)
                        .setDefaultPaymentMethod(pmId)
                        .build());
    }

    /** Creează sau obține Product Stripe pentru fiecare plan (cache simplu în memorie). */
    private final java.util.Map<String, String> productIdCache = new java.util.HashMap<>();

    private String ensureProduct(String plan) throws StripeException {
        if (productIdCache.containsKey(plan)) return productIdCache.get(plan);

        String name = "ToothFairy " + capitalize(plan);
        com.stripe.param.ProductListParams listParams = com.stripe.param.ProductListParams.builder()
                .setActive(true)
                .setLimit(100L)
                .build();
        com.stripe.model.ProductCollection products = com.stripe.model.Product.list(listParams);

        for (com.stripe.model.Product p : products.getData()) {
            if (name.equals(p.getName())) {
                productIdCache.put(plan, p.getId());
                return p.getId();
            }
        }

        com.stripe.model.Product newProduct = com.stripe.model.Product.create(
                com.stripe.param.ProductCreateParams.builder().setName(name).build());
        productIdCache.put(plan, newProduct.getId());
        return newProduct.getId();
    }

    private Cabinet getCurrentCabinet() {
        UUID id = securityUtils.getCurrentCabinetId();
        return cabinetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit."));
    }

    private long planAmount(String plan) {
        return switch (plan != null ? plan : "starter") {
            case "pro"    -> 9900L;
            case "clinic" -> 14900L;
            default       -> 6900L;
        };
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return "Starter";
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────
    public record PaymentMethodDto(
            String  id,
            String  brand,
            String  last4,
            Long    expMonth,
            Long    expYear,
            boolean isDefault
    ) {}

    public record SubscriptionDto(
            String plan,
            String status,
            Long   currentPeriodEnd,
            Long   currentPeriodStart
    ) {}
}
