package com.toothfairy.common;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class SecurityUtils {

    public UUID getCurrentCabinetId() {
        return getPrincipal();
    }

    public UUID getCurrentClinicId() {
        return getPrincipal();
    }

    public boolean isClinicAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CLINIC".equals(a.getAuthority()));
    }

    private UUID getPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated user in SecurityContext");
        }
        return (UUID) auth.getPrincipal();
    }
}
