package com.toothfairy.cabinet;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CabinetUpdateRequest {
    private String firstName;
    private String lastName;
    private String name;
    private String phone;
    private String address;
    private String city;
    private String description;
    private String slug;
    private String website;
    private String specialties;           // JSON array string
    private String languages;             // JSON array string
    private String workingHours;          // JSON array string
    private String smsSettings;           // JSON object string
    private String notificationSettings;  // JSON object string
}
