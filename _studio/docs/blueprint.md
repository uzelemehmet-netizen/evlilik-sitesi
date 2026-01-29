# **App Name**: Soulmate Nexus

## Core Features:

- User Registration and Profile Creation: Secure registration process with mandatory profile completion, including photo uploads and agreement to terms.
- KYC and Verification: Identity verification system via ID upload and selfie, with admin verification for profile badge assignment.
- Subscription Management: Membership status display with options to start, cancel, or delete subscriptions, integrated with Stripe or Iyzico.
- Intelligent Matching Algorithm: Matching engine using gender, age preferences, marriage intentions, and verification status to prioritize ideal matches. The matching algorithm is run as a scheduled job that checks the new users every night, and automatically suggest matches on the home screen
- Active Match Exclusivity: System that locks other matches upon starting an active match, unlocking after 48 hours, with options to share contact info or continue chatting on the platform. An LLM will act as a tool to decide whether there is risky personally identifiable information in the profile description and messages.
- Real-time Messaging with Moderation: In-app messaging system with content filtering for phone numbers, emails, and social media handles.
- Admin Dashboard: Admin panel for user management, KYC approvals, report handling, and system analytics.

## Style Guidelines:

- Primary color: Deep teal (#008080) evoking trust, stability, and ethical responsibility.
- Background color: Very light gray (#F0F0F0) providing a clean and neutral backdrop.
- Accent color: Coral pink (#FF8674) highlighting key interactive elements like like/match buttons and badges to suggest connection.
- Body font: 'PT Sans' sans-serif; a warm, humanist font suitable for body text and longer reading.
- Headline font: 'Playfair' sans-serif; use for headlines, for an elegant, fashionable feel.
- Use of modern, minimalist icons that are easily understandable, to maintain cultural neutrality.
- Modern card layouts with rounded corners and soft shadows to create a professional and trustworthy interface.
- Subtle micro-interactions, like YouTube-style animations on like buttons and pulsing match buttons, to enhance user engagement.