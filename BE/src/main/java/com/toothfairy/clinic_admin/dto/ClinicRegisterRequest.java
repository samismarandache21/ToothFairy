package com.toothfairy.clinic_admin.dto;

import lombok.Data;

@Data
public class ClinicRegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String city;
    private String address;
    private String stripeSessionId;
    private String paymentMethodId;
}
