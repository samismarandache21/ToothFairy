package com.toothfairy.stripe;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentMethod;
import com.stripe.model.PaymentMethodCollection;
import com.stripe.model.SetupIntent;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionItem;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.CustomerUpdateParams;
import com.stripe.param.PaymentMethodListParams;
import com.stripe.param.SubscriptionCreateParams;
import com.stripe.param.SubscriptionItemUpdateParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.model.checkout.Session;
import com.toothfairy.clinic_admin.ClinicAccount;
import com.toothfairy.clinic_admin.ClinicAccountRepository;
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
public class StripeClinicService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    private final ClinicAccountRepository clinicAccountRepository;
    private final SecurityUtils           securityUtils;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
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

    // ── Checkout Session pentru adăugare card (AUTH) ──────────────────────────
    public String createAddCardCheckoutSession(String successUrl, String cancelUrl)
            throws StripeException {
        ClinicAccount clinic = getCurrentClinic();
        if (clinic.getStripeCustomerId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Clinica nu are un profil de plată Stripe.");
        }
        Session session = Session.create(SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SETUP)
                .setCustomer(clinic.getStripeCustomerId())
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .build());
        return session.getUrl();
    }

    // ── Finalizare add-card ───────────────────────────────────────────────────
    public void finalizeAddCardSession(String sessionId) throws StripeException {
        ClinicAccount clinic = getCurrentClinic();
        Session session = Session.retrieve(sessionId);
        SetupIntent si = SetupIntent.retrieve(session.getSetupIntent());
        String pmId = si.getPaymentMethod();
        if (pmId == null) return;

        Customer customer = Customer.retrieve(clinic.getStripeCustomerId());
        boolean hasDefault = customer.getInvoiceSettings() != null
                && customer.getInvoiceSettings().getDefaultPaymentMethod() != null;
        if (!hasDefault) {
            setDefaultPaymentMethodDirect(clinic.getStripeCustomerId(),
                    clinic.getStripeSubscriptionId(), pmId);
        }
    }

    // ── Obține PaymentMethod ID dintr-o sesiune Checkout completată ───────────
    public String getPaymentMethodFromSession(String sessionId) throws StripeException {
        Session session = Session.retrieve(sessionId);
        SetupIntent si = SetupIntent.retrieve(session.getSetupIntent());
        return si.getPaymentMethod();
    }

    // ── Creare customer + abonament la înregistrare ───────────────────────────
    public void createCustomerAndSubscribe(ClinicAccount clinic, String paymentMethodId)
            throws StripeException {

        CustomerCreateParams.InvoiceSettings invoiceSettings =
                CustomerCreateParams.InvoiceSettings.builder()
                        .setDefaultPaymentMethod(paymentMethodId)
                        .build();

        CustomerCreateParams cp = CustomerCreateParams.builder()
                .setEmail(clinic.getEmail())
                .setName(clinic.getName())
                .setPaymentMethod(paymentMethodId)
                .setInvoiceSettings(invoiceSettings)
                .build();
        Customer customer = Customer.create(cp);

        Subscription sub = createSubscription(customer.getId(), paymentMethodId);

        clinic.setStripeCustomerId(customer.getId());
        clinic.setStripeSubscriptionId(sub.getId());
        clinic.setSubscriptionStatus(sub.getStatus());
    }

    // ── Lista carduri ale clinicii curente ────────────────────────────────────
    public List<StripeService.PaymentMethodDto> getPaymentMethods() throws StripeException {
        ClinicAccount clinic = getCurrentClinic();
        if (clinic.getStripeCustomerId() == null) return List.of();

        Customer customer = Customer.retrieve(clinic.getStripeCustomerId());
        String defaultPmId = (customer.getInvoiceSettings() != null)
                ? customer.getInvoiceSettings().getDefaultPaymentMethod()
                : null;

        PaymentMethodListParams params = PaymentMethodListParams.builder()
                .setCustomer(clinic.getStripeCustomerId())
                .setType(PaymentMethodListParams.Type.CARD)
                .build();
        PaymentMethodCollection pms = PaymentMethod.list(params);

        return pms.getData().stream().map(pm -> new StripeService.PaymentMethodDto(
                pm.getId(),
                pm.getCard().getBrand(),
                pm.getCard().getLast4(),
                pm.getCard().getExpMonth(),
                pm.getCard().getExpYear(),
                pm.getId().equals(defaultPmId)
        )).toList();
    }

    // ── Detașare card ─────────────────────────────────────────────────────────
    public void detachPaymentMethod(String pmId) throws StripeException {
        ClinicAccount clinic = getCurrentClinic();
        PaymentMethod pm = PaymentMethod.retrieve(pmId);
        if (pm.getCustomer() == null || !pm.getCustomer().equals(clinic.getStripeCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cardul nu aparține acestei clinici.");
        }
        pm.detach();
    }

    // ── Setare card implicit ──────────────────────────────────────────────────
    public void setDefaultPaymentMethod(String pmId) throws StripeException {
        ClinicAccount clinic = getCurrentClinic();
        if (clinic.getStripeCustomerId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clinică fără profil Stripe.");
        }
        setDefaultPaymentMethodDirect(clinic.getStripeCustomerId(),
                clinic.getStripeSubscriptionId(), pmId);
    }

    // ── Actualizare preț abonament la schimbare număr medici ─────────────────
    public void updateSubscriptionAmount(ClinicAccount clinic, int dentistCount)
            throws StripeException {
        if (clinic.getStripeSubscriptionId() == null) return;

        long unitAmountBani = 15000L + Math.max(0, dentistCount - 3) * 5000L;

        Subscription sub = Subscription.retrieve(clinic.getStripeSubscriptionId());
        if (sub.getItems().getData().isEmpty()) return;

        SubscriptionItem item = sub.getItems().getData().get(0);
        item.update(SubscriptionItemUpdateParams.builder()
                .setPriceData(SubscriptionItemUpdateParams.PriceData.builder()
                        .setCurrency("ron")
                        .setUnitAmount(unitAmountBani)
                        .setProduct(ensureClinicProduct())
                        .setRecurring(SubscriptionItemUpdateParams.PriceData.Recurring.builder()
                                .setInterval(SubscriptionItemUpdateParams.PriceData.Recurring.Interval.MONTH)
                                .build())
                        .build())
                .build());
    }

    // ── Info abonament curent ─────────────────────────────────────────────────
    public StripeService.SubscriptionDto getSubscription() throws StripeException {
        ClinicAccount clinic = getCurrentClinic();
        if (clinic.getStripeSubscriptionId() == null) {
            return new StripeService.SubscriptionDto("clinic", "no_subscription", null, null);
        }
        Subscription sub = Subscription.retrieve(clinic.getStripeSubscriptionId());
        return new StripeService.SubscriptionDto(
                "clinic",
                sub.getStatus(),
                sub.getCurrentPeriodEnd(),
                sub.getCurrentPeriodStart()
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Subscription createSubscription(String customerId, String pmId)
            throws StripeException {

        SubscriptionCreateParams.Item.PriceData.Recurring recurring =
                SubscriptionCreateParams.Item.PriceData.Recurring.builder()
                        .setInterval(SubscriptionCreateParams.Item.PriceData.Recurring.Interval.MONTH)
                        .build();

        SubscriptionCreateParams.Item.PriceData priceData =
                SubscriptionCreateParams.Item.PriceData.builder()
                        .setCurrency("ron")
                        .setUnitAmount(15000L) // 150 RON base
                        .setRecurring(recurring)
                        .setProduct(ensureClinicProduct())
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

    private String clinicProductId;

    private String ensureClinicProduct() throws StripeException {
        if (clinicProductId != null) return clinicProductId;

        String name = "ToothFairy Clinic";
        com.stripe.param.ProductListParams listParams = com.stripe.param.ProductListParams.builder()
                .setActive(true)
                .setLimit(100L)
                .build();
        com.stripe.model.ProductCollection products = com.stripe.model.Product.list(listParams);

        for (com.stripe.model.Product p : products.getData()) {
            if (name.equals(p.getName())) {
                clinicProductId = p.getId();
                return clinicProductId;
            }
        }

        com.stripe.model.Product newProduct = com.stripe.model.Product.create(
                com.stripe.param.ProductCreateParams.builder().setName(name).build());
        clinicProductId = newProduct.getId();
        return clinicProductId;
    }

    private void setDefaultPaymentMethodDirect(String customerId, String subscriptionId, String pmId)
            throws StripeException {
        CustomerUpdateParams.InvoiceSettings invoiceSettings =
                CustomerUpdateParams.InvoiceSettings.builder()
                        .setDefaultPaymentMethod(pmId)
                        .build();
        Customer.retrieve(customerId).update(
                CustomerUpdateParams.builder().setInvoiceSettings(invoiceSettings).build());

        if (subscriptionId != null) {
            com.stripe.param.SubscriptionUpdateParams updateParams =
                    com.stripe.param.SubscriptionUpdateParams.builder()
                            .setDefaultPaymentMethod(pmId)
                            .build();
            Subscription.retrieve(subscriptionId).update(updateParams);
        }
    }

    private ClinicAccount getCurrentClinic() {
        UUID id = securityUtils.getCurrentClinicId();
        return clinicAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinică negăsită."));
    }
}
