package com.toothfairy.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Prenumele este obligatoriu")
    private String firstName;

    @NotBlank(message = "Numele este obligatoriu")
    private String lastName;

    private String cabinetName;

    private String phone;

    @NotBlank(message = "Emailul este obligatoriu")
    @Email(message = "Email invalid")
    private String email;

    @NotBlank(message = "Parola este obligatorie")
    @Size(min = 8, message = "Minim 8 caractere")
    private String password;

    private String plan = "starter";

    // Optional — trimis după confirmare cu Stripe.js (embedded)
    private String paymentMethodId;

    // Optional — trimis după revenire din Stripe Checkout (link)
    private String stripeSessionId;

    // Optional — email clinică pentru cerere de alăturare automată la înregistrare
    private String clinicEmail;
}
