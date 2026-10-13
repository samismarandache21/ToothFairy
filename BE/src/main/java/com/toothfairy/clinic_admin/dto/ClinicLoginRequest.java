package com.toothfairy.clinic_admin.dto;

import lombok.Data;

@Data
public class ClinicLoginRequest {
    private String email;
    private String password;
}
