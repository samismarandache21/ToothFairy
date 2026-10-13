# ToothFairy

A practice-management and online-booking platform for dental practices. Dentists run their agenda, patients and subscription from one dashboard; patients find a dentist, see free slots and book online; clinics group several dentists under one account.

Built for the Romanian market: the UI is in Romanian and subscriptions are billed in RON.

<!-- Screenshots: add a short GIF of the calendar and the patient booking flow here. -->

## Features

### For dentists
- **Dashboard**: today's and upcoming appointments, key stats, latest reviews and quick actions.
- **Calendar**: create, edit and cancel appointments, block out breaks, and get an automatic overlap check. Appointments move through confirmed, pending, completed, cancelled and no-show.
- **Agenda import (OCR)**: photograph a paper agenda and ToothFairy turns it into appointments. Google Cloud Vision reads the (often handwritten) page, a parser picks up day headers such as "Luni, 8 iunie 2026" and times written as 9:30, 9.30 or 9h30, treatment abbreviations are normalised, missing durations are estimated, and existing patients are matched by name. Nothing is saved until the dentist confirms the preview.
- **Patients**: searchable patient records with full appointment history.
- **Services**: the practice's treatment catalogue, with durations and prices.
- **Statistics**: charts of appointments over time and other practice metrics.
- **Public profile**: description, specialties, languages, photos and a public page patients book from.
- **Reviews**: ratings and comments left by patients.
- **Billing**: Stripe subscriptions (Starter 69 RON, Pro 99 RON, Clinic 149 RON per month), saved cards and plan changes.

### For patients
- Browse dentists and clinics, including a map view.
- See available time slots on a dentist's page and book online.
- Patient account with "My bookings": view and cancel appointments, and leave a review.

### For clinics
- A clinic account groups several dentists.
- Dentists send join requests; the clinic admin approves or rejects them and manages members.
- Clinic-wide dashboard, settings and billing.

## How it works

```
React SPA (Vite)  ──  REST/JSON + JWT  ──▶  Spring Boot API  ──▶  PostgreSQL
                                                 ├──▶ Stripe (subscriptions, cards)
                                                 └──▶ Google Cloud Vision (agenda OCR)
```

There are three account types (dentist, patient, clinic admin), each with its own JWT-secured area. A single login screen routes each user to the right one.

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | Java 17, Spring Boot 3.2 (Web, Security, Data JPA, Validation, WebClient), JWT (jjwt), PostgreSQL, Stripe Java SDK, Lombok |
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 4, shadcn/ui (Radix), Framer Motion, GSAP, Axios, Stripe Elements |
| Testing | JUnit 5, Spring Boot Test, Spring Security Test, H2 for integration tests; Vitest and Testing Library |

## Project structure

```
BE/                         Spring Boot API (package com.toothfairy)
  auth/, patient_auth/,     the three account types and JWT handling
  clinic_admin/
  appointment/, breaks/,    scheduling, patient records, treatment catalogue
  patient/, service/
  import_agenda/            OCR agenda import: OCR, parsing, normalisation, durations, import
  public_portal/            public dentist pages, free slots, booking, reviews
  cabinet/, stats/,         practice profile, statistics, reviews, Stripe billing
  review/, stripe/
  config/, common/          security, JWT filter, shared helpers
  src/main/resources/schema.sql   PostgreSQL schema
FE/                         React app
  src/pages/                dentist area, patient/ and clinic-admin/
  src/components/, src/hooks/, src/lib/api.js
```

## Running locally

**Prerequisites:** Java 17+, Maven, Node 18+, PostgreSQL, Stripe test keys, and a Google Cloud Vision API key (only needed for agenda import).

1. Create the database:
   ```bash
   createdb toothfairy
   ```
2. Create `BE/src/main/resources/application.properties` (it is not committed):
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/toothfairy
   spring.datasource.username=postgres
   spring.datasource.password=your_password
   # Runs schema.sql on startup (every statement is CREATE ... IF NOT EXISTS)
   spring.sql.init.mode=always

   # At least 32 characters; token lifetime in milliseconds (7 days)
   jwt.secret=change-me-to-a-long-random-string
   jwt.expiration=604800000

   stripe.secret-key=sk_test_...
   google.vision.api.key=your_vision_api_key
   ```
3. Start the API (port 8080):
   ```bash
   cd BE
   mvn spring-boot:run
   ```
4. Start the frontend and open the URL Vite prints:
   ```bash
   cd FE
   npm install
   npm run dev
   ```
   The frontend calls the API on port 8080 of the same host, so it also works from a phone on the same network. The Stripe publishable key is set in `FE/src/components/ui/StripeCardForm.jsx`.

## Tests

```bash
cd BE && mvn test
cd FE && npm test
```

## Roadmap

- **SMS appointment reminders**: the data model, per-account SMS credits and the reminder query are in place; sending is not wired up yet.
