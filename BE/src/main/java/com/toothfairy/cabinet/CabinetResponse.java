package com.toothfairy.cabinet;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO pentru răspunsuri cabinet — NU include parola.
 */
@Getter
@Builder
public class CabinetResponse {

    private UUID   id;
    private String firstName;
    private String lastName;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String description;
    private String slug;
    private String website;
    private String coverPhoto;             // base64 JPEG
    private String profilePhoto;           // base64 JPEG
    private String specialties;           // JSON array: ["Implantologie","Estetică"]
    private String languages;             // JSON array: ["Română","Engleză"]
    private String workingHours;          // JSON array: [{day,open,start,end}]
    private String smsSettings;           // JSON object: {provider,senderId,...}
    private String notificationSettings;  // JSON object: {newAppointmentEmail,...}

    private Integer    smsCredits;
    private String     plan;
    private BigDecimal rating;
    private Integer    reviewCount;
    private UUID       clinicAccountId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CabinetResponse from(Cabinet c) {
        return CabinetResponse.builder()
                .id(c.getId())
                .firstName(c.getFirstName())
                .lastName(c.getLastName())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .city(c.getCity())
                .description(c.getDescription())
                .slug(c.getSlug())
                .website(c.getWebsite())
                .coverPhoto(c.getCoverPhoto())
                .profilePhoto(c.getProfilePhoto())
                .specialties(c.getSpecialties())
                .languages(c.getLanguages())
                .workingHours(c.getWorkingHours())
                .smsSettings(c.getSmsSettings())
                .notificationSettings(c.getNotificationSettings())
                .smsCredits(c.getSmsCredits())
                .plan(c.getPlan())
                .rating(c.getRating())
                .reviewCount(c.getReviewCount())
                .clinicAccountId(c.getClinicAccountId())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
