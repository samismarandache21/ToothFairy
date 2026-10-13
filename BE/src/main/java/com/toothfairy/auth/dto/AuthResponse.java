package com.toothfairy.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private CabinetInfo cabinet;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class CabinetInfo {
        private UUID   id;
        private String firstName;
        private String lastName;
        private String name;
        private String email;
        private String phone;
        private String city;
        private String address;
        private String description;
        private String slug;
        private String website;
        private String specialties;
        private String languages;
        private String     plan;
        private Integer    smsCredits;
        private BigDecimal rating;
        private Integer    reviewCount;
        private String     profilePhoto;
        private String     coverPhoto;
    }
}
