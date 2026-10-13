package com.toothfairy.clinic_admin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ClinicAuthResponse {
    private String token;
    private ClinicInfo clinic;

    @Data
    @Builder
    public static class ClinicInfo {
        private UUID   id;
        private String name;
        private String email;
        private String phone;
        private String city;
        private String address;
        private String description;
    }
}
