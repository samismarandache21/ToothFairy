package com.toothfairy.cabinet;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cabinets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cabinet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ── Date dentist ───────────────────────────────────────────────────────
    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    // ── Date cabinet ───────────────────────────────────────────────────────
    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String city;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ── Profil public ──────────────────────────────────────────────────────
    /** Identificator URL-friendly, ex: "cabinet-dr-popescu-cluj" */
    private String slug;

    private String website;

    /** Fotografie de copertă (base64 JPEG, comprimată client-side) */
    @Column(name = "cover_photo", columnDefinition = "TEXT")
    private String coverPhoto;

    /** Fotografie de profil / avatar (base64 JPEG, comprimată client-side) */
    @Column(name = "profile_photo", columnDefinition = "TEXT")
    private String profilePhoto;

    /** Specialități stocate ca JSON array: ["Implantologie","Estetică"] */
    @Column(columnDefinition = "TEXT")
    private String specialties;

    /** Limbi vorbite stocate ca JSON array: ["Română","Engleză"] */
    @Column(columnDefinition = "TEXT")
    private String languages;

    /** Program de lucru: JSON array [{day,open,start,end}] */
    @Column(name = "working_hours", columnDefinition = "TEXT")
    private String workingHours;

    /** Setări SMS provider: JSON object {provider,senderId,reminderEnabled,...} */
    @Column(name = "sms_settings", columnDefinition = "TEXT")
    private String smsSettings;

    /** Preferințe notificări: JSON object {newAppointmentEmail,...} */
    @Column(name = "notification_settings", columnDefinition = "TEXT")
    private String notificationSettings;

    // ── Plan & SMS ─────────────────────────────────────────────────────────
    @Column(name = "sms_credits")
    @Builder.Default
    private Integer smsCredits = 50;

    @Builder.Default
    private String plan = "starter";

    // ── Stripe Billing ─────────────────────────────────────────────────────
    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "subscription_status")
    private String subscriptionStatus;

    // ── Clinic membership ─────────────────────────────────────────────────
    /** Setat când un dentist este acceptat într-o clinică */
    @Column(name = "clinic_account_id")
    private UUID clinicAccountId;

    // ── Vizibilitate publică ───────────────────────────────────────────────
    /** false când medicul a fost eliminat dintr-o clinică — ascuns din search până reactivează */
    @Column(columnDefinition = "boolean not null default true")
    @Builder.Default
    private boolean active = true;

    // ── Rating ────────────────────────────────────────────────────────────
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    // ── Timestamps ────────────────────────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
