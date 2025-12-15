// Learning Center Data - Auto-updates with platform features
// Last Updated: December 2024 | Platform Version 2.0

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  relatedArticles?: string[];
}

export interface TutorialStep {
  step: number;
  title: string;
  content: string;
  tips?: string[];
  warnings?: string[];
}

export interface Tutorial {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  steps: TutorialStep[];
  prerequisites?: string[];
  outcomes?: string[];
}

export interface SOPStep {
  step: number;
  title: string;
  description: string;
  notes?: string;
  timeEstimate?: string;
}

export interface SOP {
  id: number;
  title: string;
  code: string;
  version: string;
  lastUpdated: string;
  category: string;
  department: string;
  overview: string;
  scope: string;
  responsibilities: string[];
  steps: SOPStep[];
  qualityChecks: string[];
  relatedSOPs?: string[];
}

export interface Video {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  views: number;
  likes: number;
  featured?: boolean;
  isNew?: boolean;
  chapters?: { time: string; title: string }[];
}

export interface GettingStartedGuide {
  id: number;
  title: string;
  description: string;
  duration: string;
  steps: number;
  category: string;
  difficulty: string;
  keyPoints: string[];
}

// ===========================================
// GETTING STARTED GUIDES
// ===========================================

export const gettingStartedGuides: GettingStartedGuide[] = [
  {
    id: 1,
    title: 'Create Your Account',
    description: 'Set up your MDBaise account as a patient or healthcare provider in minutes',
    duration: '3 min',
    steps: 5,
    category: 'Account',
    difficulty: 'Beginner',
    keyPoints: [
      'Choose between patient or provider account',
      'Verify your email address',
      'Complete your basic profile information',
      'Set notification preferences',
      'Enable two-factor authentication for security'
    ]
  },
  {
    id: 2,
    title: 'Find a Doctor',
    description: 'Search for healthcare professionals by specialty, location, ratings, or name',
    duration: '2 min',
    steps: 4,
    category: 'Search',
    difficulty: 'Beginner',
    keyPoints: [
      'Use filters to narrow your search',
      'Compare doctor profiles and reviews',
      'Check availability and consultation types',
      'View accepted insurance plans'
    ]
  },
  {
    id: 3,
    title: 'Book an Appointment',
    description: 'Schedule in-person or teleconsultation appointments with ease',
    duration: '4 min',
    steps: 6,
    category: 'Booking',
    difficulty: 'Beginner',
    keyPoints: [
      'Select appointment type (in-person or video)',
      'Choose your preferred date and time',
      'Add reason for visit and notes',
      'Complete payment securely',
      'Receive instant confirmation'
    ]
  },
  {
    id: 4,
    title: 'Message Your Provider',
    description: 'Start secure conversations with healthcare professionals',
    duration: '2 min',
    steps: 3,
    category: 'Communication',
    difficulty: 'Beginner',
    keyPoints: [
      'Send messages before or after appointments',
      'Share documents and images securely',
      'Get notified when providers respond'
    ]
  },
  {
    id: 5,
    title: 'Leave a Review',
    description: 'Share your experience and help others find great doctors',
    duration: '2 min',
    steps: 4,
    category: 'Reviews',
    difficulty: 'Beginner',
    keyPoints: [
      'Rate multiple aspects of your experience',
      'Write detailed feedback',
      'Help the community make informed decisions',
      'See provider responses to reviews'
    ]
  },
  {
    id: 6,
    title: 'Manage Payments',
    description: 'Add payment methods, view transactions, and manage billing',
    duration: '3 min',
    steps: 5,
    category: 'Payments',
    difficulty: 'Beginner',
    keyPoints: [
      'Add credit/debit cards or PIX',
      'View transaction history',
      'Download receipts and invoices',
      'Request refunds when eligible',
      'Manage saved payment methods'
    ]
  },
  {
    id: 7,
    title: 'Join a Teleconsultation',
    description: 'Connect with your doctor via secure video call from anywhere',
    duration: '3 min',
    steps: 4,
    category: 'Teleconsultation',
    difficulty: 'Beginner',
    keyPoints: [
      'Test your camera and microphone beforehand',
      'Join 5 minutes before scheduled time',
      'Ensure stable internet connection',
      'Access consultation summary afterwards'
    ]
  },
  {
    id: 8,
    title: 'Become a Provider',
    description: 'Register as a healthcare provider and start building your practice',
    duration: '10 min',
    steps: 8,
    category: 'Providers',
    difficulty: 'Beginner',
    keyPoints: [
      'Submit your medical credentials (CRM)',
      'Complete profile verification',
      'Set up services and pricing',
      'Configure your availability',
      'Start accepting patients'
    ]
  },
  {
    id: 9,
    title: 'Use the Map View',
    description: 'Find healthcare providers near you using interactive map',
    duration: '2 min',
    steps: 3,
    category: 'Search',
    difficulty: 'Beginner',
    keyPoints: [
      'View providers on interactive map',
      'Filter by specialty and distance',
      'Get directions to clinics'
    ]
  },
  {
    id: 10,
    title: 'Set Up Notifications',
    description: 'Configure how and when you receive updates and reminders',
    duration: '2 min',
    steps: 4,
    category: 'Settings',
    difficulty: 'Beginner',
    keyPoints: [
      'Enable push notifications',
      'Set email preferences',
      'Configure appointment reminders',
      'Set quiet hours'
    ]
  },
  // NEW: HIPAA Compliance Guides
  {
    id: 11,
    title: 'Understanding HIPAA Compliance',
    description: 'Learn about data privacy, encrypted communications, and patient rights',
    duration: '5 min',
    steps: 6,
    category: 'Security',
    difficulty: 'Intermediate',
    keyPoints: [
      'All communications are end-to-end encrypted',
      'Audit logs track all data access',
      'Patient consent forms are digital and secure',
      'You control who sees your medical information',
      'Request data export anytime',
      'Right to data deletion under LGPD/HIPAA'
    ]
  },
  {
    id: 12,
    title: 'Sign Patient Consent Forms',
    description: 'Electronically sign consent forms before consultations',
    duration: '2 min',
    steps: 4,
    category: 'Security',
    difficulty: 'Beginner',
    keyPoints: [
      'Review consent form details carefully',
      'Electronic signatures are legally binding',
      'Access signed forms anytime in your profile',
      'Revoke consent when no longer needed'
    ]
  },
  // NEW: Prescription Management Guides
  {
    id: 13,
    title: 'View Your Prescriptions',
    description: 'Access current and past prescriptions from your providers',
    duration: '2 min',
    steps: 3,
    category: 'Prescriptions',
    difficulty: 'Beginner',
    keyPoints: [
      'View active and expired prescriptions',
      'Check medication dosage and instructions',
      'Track refills remaining',
      'Send prescriptions to your pharmacy'
    ]
  },
  {
    id: 14,
    title: 'Request Prescription Refills',
    description: 'Request refills for ongoing medications',
    duration: '3 min',
    steps: 4,
    category: 'Prescriptions',
    difficulty: 'Beginner',
    keyPoints: [
      'Check refill eligibility',
      'Request through your patient portal',
      'Provider reviews within 24-48 hours',
      'Get notified when ready'
    ]
  },
  // NEW: Medical Records Guides
  {
    id: 15,
    title: 'Upload Medical Records',
    description: 'Securely upload lab results, imaging, and health documents',
    duration: '3 min',
    steps: 5,
    category: 'Medical Records',
    difficulty: 'Beginner',
    keyPoints: [
      'Supported formats: PDF, JPG, PNG, DICOM',
      'Files are encrypted at rest and in transit',
      'Share selectively with providers',
      'Organize by record type and date',
      'Download your records anytime'
    ]
  },
  {
    id: 16,
    title: 'Share Records with Providers',
    description: 'Grant access to your medical records for better care',
    duration: '2 min',
    steps: 3,
    category: 'Medical Records',
    difficulty: 'Beginner',
    keyPoints: [
      'Choose what to share',
      'Set access duration',
      'Revoke access anytime',
      'View access history'
    ]
  },
  // NEW: Video Consultation Enhanced Guides
  {
    id: 17,
    title: 'Start a Video Consultation',
    description: 'Complete guide to joining secure video calls with providers',
    duration: '4 min',
    steps: 6,
    category: 'Video',
    difficulty: 'Beginner',
    keyPoints: [
      'WebRTC-based secure connection',
      'No downloads required',
      'Screen sharing available',
      'In-call chat and file sharing',
      'Recording with consent only',
      'Post-consultation summary'
    ]
  },
  // NEW: Insurance Verification Guides
  {
    id: 18,
    title: 'Upload Insurance Information',
    description: 'Add your insurance cards for eligibility verification',
    duration: '3 min',
    steps: 4,
    category: 'Insurance',
    difficulty: 'Beginner',
    keyPoints: [
      'Upload front and back of insurance card',
      'Real-time eligibility checking',
      'See coverage details before booking',
      'Multiple insurance plans supported'
    ]
  },
  {
    id: 19,
    title: 'Check Insurance Eligibility',
    description: 'Verify your coverage before booking appointments',
    duration: '2 min',
    steps: 3,
    category: 'Insurance',
    difficulty: 'Beginner',
    keyPoints: [
      'Instant eligibility verification',
      'See copay estimates',
      'View covered services',
      'Check deductible status'
    ]
  },
  // NEW: Appointment Reminders Guides
  {
    id: 20,
    title: 'Set Up Appointment Reminders',
    description: 'Never miss an appointment with SMS, email, and calendar reminders',
    duration: '2 min',
    steps: 4,
    category: 'Reminders',
    difficulty: 'Beginner',
    keyPoints: [
      'Choose reminder timing (24h, 2h, 30min)',
      'Multiple channels: SMS, email, push',
      'Sync with Google/Apple Calendar',
      'Customize per appointment type'
    ]
  }
];

// ===========================================
// FREQUENTLY ASKED QUESTIONS
// ===========================================

export const faqs: FAQ[] = [
  // Account FAQs
  {
    id: 1,
    question: 'How do I create an account on MDBaise?',
    answer: 'To create an account, click the "Join" button in the top right corner of the homepage. You can sign up using your email address or connect with your Google account. Fill in your basic information including name, email, and phone number, then verify your email to activate your account. The entire process takes less than 2 minutes.',
    category: 'account',
    relatedArticles: ['Profile Setup', 'Account Verification']
  },
  {
    id: 2,
    question: 'Can I use MDBaise without creating an account?',
    answer: 'Yes, you can browse doctor profiles, view specialties, read reviews, and explore the platform without an account. However, to book appointments, message providers, save favorites, or leave reviews, you will need to create a free account. This ensures secure communication and appointment management.',
    category: 'account'
  },
  {
    id: 3,
    question: 'How do I reset my password?',
    answer: 'Click "Login" on the homepage, then select "Forgot Password". Enter your registered email address and we will send you a secure password reset link. The link expires after 24 hours for security. If you don\'t receive the email, check your spam folder or contact support.',
    category: 'account'
  },
  {
    id: 4,
    question: 'How do I update my profile information?',
    answer: 'Go to your Profile page by clicking your avatar in the top right corner, then select "Edit Profile". You can update your personal information, contact details, profile photo, and preferences. Changes are saved automatically. Some changes like email address may require re-verification.',
    category: 'account'
  },
  {
    id: 5,
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Settings > Account > Delete Account. You will need to confirm your password and the deletion. Please note that account deletion is permanent and will remove all your appointment history, reviews, and saved information. We recommend downloading your data before deletion.',
    category: 'account'
  },
  {
    id: 6,
    question: 'Is my personal information secure on MDBaise?',
    answer: 'Yes, we take data security very seriously. All personal and medical information is encrypted using industry-standard protocols. We comply with LGPD (Brazil\'s General Data Protection Law) and follow HIPAA guidelines. We never sell or share your personal information with third parties without your explicit consent.',
    category: 'account'
  },

  // Booking FAQs
  {
    id: 7,
    question: 'How do I book an appointment with a doctor?',
    answer: 'Find a doctor using our search feature by entering a specialty, name, or location. Visit their profile to view services, reviews, and availability. Click "Book Appointment" to see available time slots. Select your preferred date and time, choose between in-person or teleconsultation (if available), add any notes for the doctor, and complete the booking with payment.',
    category: 'booking'
  },
  {
    id: 8,
    question: 'Can I cancel or reschedule my appointment?',
    answer: 'Yes, you can cancel or reschedule appointments from your Dashboard under "My Appointments". Click on the appointment and select "Reschedule" or "Cancel". Most providers require at least 24 hours notice for cancellations to receive a full refund. Check the specific provider\'s cancellation policy on their profile for exact terms.',
    category: 'booking'
  },
  {
    id: 9,
    question: 'How far in advance can I book appointments?',
    answer: 'Booking availability varies by provider. Most doctors allow bookings up to 30 days in advance, while some specialists may have longer or shorter windows. The available dates are shown in green on the booking calendar. If you need an urgent appointment, look for providers with same-day or next-day availability.',
    category: 'booking'
  },
  {
    id: 10,
    question: 'What if the doctor I want is fully booked?',
    answer: 'If your preferred doctor has no available slots, you can: 1) Check back later as cancellations may open slots, 2) Join their waitlist if available, 3) Enable notifications to be alerted when slots open, or 4) Browse similar providers in the same specialty who may have earlier availability.',
    category: 'booking'
  },
  {
    id: 11,
    question: 'Can I book appointments for family members?',
    answer: 'Yes, you can book appointments for family members or dependents. During the booking process, you can specify that the appointment is for someone else and enter their details. For minors, the parent or guardian\'s information will be associated with the booking for communication and payment purposes.',
    category: 'booking'
  },
  {
    id: 12,
    question: 'What should I do if I\'m running late for my appointment?',
    answer: 'If you\'re running late, please message your provider through the app as soon as possible. Most providers have a grace period of 10-15 minutes. If you arrive after this window, the appointment may need to be rescheduled and fees may apply. For teleconsultations, join as soon as you can - the provider may still be available.',
    category: 'booking'
  },

  // Payment FAQs
  {
    id: 13,
    question: 'What payment methods are accepted?',
    answer: 'MDBaise accepts major credit cards (Visa, Mastercard, American Express, Elo), debit cards, and PIX for instant payment in Brazil. Some providers may also accept insurance - check their profile for a list of accepted insurance plans. All payments are processed securely through encrypted connections.',
    category: 'payments'
  },
  {
    id: 14,
    question: 'When am I charged for an appointment?',
    answer: 'For most appointments, your card is authorized (not charged) at booking time to reserve the appointment. The actual charge occurs after the consultation is completed. For teleconsultations, some providers may require upfront payment. Cancellations within the allowed window result in full authorization release or refund.',
    category: 'payments'
  },
  {
    id: 15,
    question: 'How do I request a refund?',
    answer: 'To request a refund, go to your appointment history in your Dashboard, select the appointment, and click "Request Refund". Provide a reason for your request. Our team reviews refund requests within 2-3 business days. Eligible refunds are processed to your original payment method within 5-10 business days depending on your bank.',
    category: 'payments'
  },
  {
    id: 16,
    question: 'Can I use my health insurance on MDBaise?',
    answer: 'Many providers on MDBaise accept health insurance. Check the provider\'s profile under "Accepted Insurance" to see which plans they work with. If your insurance is accepted, you may only need to pay your copay. Contact your insurance provider to understand your coverage for telemedicine and in-person consultations.',
    category: 'payments'
  },
  {
    id: 17,
    question: 'How do I get a receipt for my appointment?',
    answer: 'Receipts are automatically generated after each completed appointment. You can find them in your Dashboard under "Payment History". Click on any transaction to view or download the receipt. You can also request an official medical receipt (nota fiscal) for tax purposes through your appointment details.',
    category: 'payments'
  },
  {
    id: 18,
    question: 'What happens if a provider doesn\'t show up?',
    answer: 'If a provider fails to attend a scheduled appointment without notice, you are entitled to a full refund. Report the no-show through your appointment details within 24 hours. Our support team will investigate and process your refund. Repeated no-shows by providers result in account penalties.',
    category: 'payments'
  },

  // Teleconsultation FAQs
  {
    id: 19,
    question: 'How do I join a teleconsultation?',
    answer: 'Before your appointment, ensure you have a stable internet connection and allow camera/microphone access in your browser. At your scheduled time, go to "My Appointments" in your Dashboard and click "Join Call" on the appointment. The video call will open directly in your browser - no additional software downloads are needed.',
    category: 'teleconsultation'
  },
  {
    id: 20,
    question: 'What if I have technical issues during a teleconsultation?',
    answer: 'If you experience issues: 1) Try refreshing the page, 2) Switch to a different browser (Chrome recommended), 3) Check your internet connection, 4) Ensure camera/microphone permissions are enabled, 5) Try using a different device. If problems persist, message your provider to reschedule. Technical issues documented at time of occurrence are grounds for a full refund.',
    category: 'teleconsultation'
  },
  {
    id: 21,
    question: 'Are teleconsultations secure and private?',
    answer: 'Yes, all teleconsultations use end-to-end encryption and comply with healthcare privacy regulations (LGPD/HIPAA). Video calls are not recorded unless both parties explicitly consent. Your health information is protected and confidential. We use secure servers and never store video recordings without permission.',
    category: 'teleconsultation'
  },
  {
    id: 22,
    question: 'What equipment do I need for a teleconsultation?',
    answer: 'You need: 1) A device with a camera and microphone (smartphone, tablet, or computer), 2) A stable internet connection (minimum 1 Mbps), 3) A modern web browser (Chrome, Safari, Firefox, or Edge). For best quality, use a device with a good camera and find a quiet, well-lit location.',
    category: 'teleconsultation'
  },
  {
    id: 23,
    question: 'Can I share documents during a teleconsultation?',
    answer: 'Yes, you can share documents, images, and test results during your teleconsultation using the chat feature within the video call. You can also upload documents to your appointment beforehand so the provider can review them in advance. Supported formats include PDF, JPG, PNG, and common document types.',
    category: 'teleconsultation'
  },
  {
    id: 24,
    question: 'What types of consultations work well via video?',
    answer: 'Teleconsultations are ideal for: follow-up appointments, prescription renewals, mental health sessions, general medical advice, reviewing test results, skin condition assessments (dermatology), and many primary care consultations. Physical examinations and procedures requiring hands-on care need in-person visits.',
    category: 'teleconsultation'
  },

  // Provider FAQs
  {
    id: 25,
    question: 'How do I become a provider on MDBaise?',
    answer: 'Click "Join" on the homepage and select "Healthcare Provider". Complete your professional profile including your CRM number, specialty, medical school, and graduation year. Upload required documents for verification (CRM certificate, diploma, specialty certifications). Once approved (typically 2-5 business days), you can start accepting appointments.',
    category: 'providers'
  },
  {
    id: 26,
    question: 'What are the fees for providers?',
    answer: 'MDBaise offers tiered subscription plans: FREE (up to 5 appointments/month, basic profile), PRO ($49/month - unlimited appointments, priority placement, analytics), and ELITE ($99/month - all PRO features plus verified badge, featured placement, advanced marketing tools). A small transaction fee (5-10% depending on plan) applies to completed appointments.',
    category: 'providers'
  },
  {
    id: 27,
    question: 'How do I verify my medical credentials?',
    answer: 'Upload your CRM certificate, medical degree diploma, and any specialty certifications to your provider dashboard under "Credentials". Ensure documents are clear, legible, and show expiration dates where applicable. Our verification team reviews documents within 2-5 business days. Verified providers receive a badge on their profile.',
    category: 'providers'
  },
  {
    id: 28,
    question: 'How do I manage my availability?',
    answer: 'Go to Provider Dashboard > Availability. Set your regular working hours for each day of the week, specifying start and end times. You can block specific dates for vacation or personal time, set consultation duration (15, 30, 45, or 60 minutes), and add buffer time between appointments. Changes sync immediately to your booking calendar.',
    category: 'providers'
  },
  {
    id: 29,
    question: 'How do I set up my services and pricing?',
    answer: 'Navigate to Provider Dashboard > Services. Add each service you offer with a clear name and description. Set pricing options: fixed price, hourly rate, or quote-based. You can create packages combining multiple services. Enable or disable teleconsultation for each service. Add any warranties or guarantees you offer.',
    category: 'providers'
  },
  {
    id: 30,
    question: 'When do I receive payment for appointments?',
    answer: 'After a consultation is marked complete by both parties, the payment (minus platform fees) is added to your payout balance. Payouts are processed weekly on Fridays via bank transfer or PIX. You can view your earnings, pending payouts, and transaction history in your Provider Dashboard under "Payouts".',
    category: 'providers'
  },
  {
    id: 31,
    question: 'How do I respond to patient reviews?',
    answer: 'Go to Provider Dashboard > Reviews to see all patient feedback. Click "Respond" on any review to write a public response. Be professional and courteous in all responses. Thank patients for positive reviews and professionally address concerns in negative ones. Responses are visible to all users viewing your profile.',
    category: 'providers'
  },
  {
    id: 32,
    question: 'Can I have a team or multiple staff members?',
    answer: 'Yes, ELITE plan subscribers can add team members to their practice. Go to Provider Dashboard > Team to invite staff. You can assign roles: Admin (full access), Staff (manage appointments), or Support (messaging only). Each team member gets their own login but operates under your practice profile.',
    category: 'providers'
  },

  // Platform Features FAQs
  {
    id: 33,
    question: 'How does the referral program work?',
    answer: 'Share your unique referral code with friends and family. When someone signs up using your code and completes their first appointment, both you and the new user receive R$20 in platform credits. There\'s no limit to how many people you can refer. Track your referrals and earnings in Profile > Referrals.',
    category: 'features'
  },
  {
    id: 34,
    question: 'What is the Social Feed?',
    answer: 'The Social Feed allows healthcare providers to share educational content, health tips, and updates with the community. Patients can follow their favorite providers, like and comment on posts, and discover new healthcare professionals. Providers can go live to broadcast video content and engage with audiences in real-time.',
    category: 'features'
  },
  {
    id: 35,
    question: 'How do I save favorite providers?',
    answer: 'Click the heart icon on any provider\'s profile card or profile page to add them to your favorites. Access your saved providers anytime from Profile > Favorites. You\'ll receive notifications when your favorited providers have special offers or new availability.',
    category: 'features'
  },
  {
    id: 36,
    question: 'How does the rating system work?',
    answer: 'After each completed appointment, patients can rate their experience on multiple dimensions: overall satisfaction, punctuality, communication, professionalism, and value. The overall rating (1-5 stars) is displayed on provider profiles. Written reviews help others understand the experience in detail.',
    category: 'features'
  },
  {
    id: 37,
    question: 'Can I schedule recurring appointments?',
    answer: 'Yes, for ongoing care you can set up recurring appointments. After booking, select "Make Recurring" and choose the frequency (weekly, bi-weekly, monthly). The system will automatically book future appointments at the same time. You can pause or cancel the recurring schedule anytime.',
    category: 'features'
  },
  {
    id: 38,
    question: 'How do appointment reminders work?',
    answer: 'You\'ll receive automatic reminders before your appointments: 24 hours before via email, 2 hours before via push notification, and 15 minutes before via SMS (if enabled). Customize reminder timing and channels in Settings > Notifications. Providers can also send custom reminders.',
    category: 'features'
  },

  // Support FAQs
  {
    id: 39,
    question: 'How do I contact customer support?',
    answer: 'For assistance, you can: 1) Use the in-app chat support (click the chat icon), 2) Email support@mdbaise.com, 3) Call our support line during business hours. Most inquiries are resolved within 24 hours. For urgent medical matters, please contact emergency services directly.',
    category: 'support'
  },
  {
    id: 40,
    question: 'What should I do if I have a complaint about a provider?',
    answer: 'If you have a concern about a provider: 1) Leave an honest review describing your experience, 2) Use the "Report" button on their profile for serious issues, 3) Contact our support team with details. We investigate all reports and take appropriate action to maintain platform quality.',
    category: 'support'
  },

  // HIPAA & Security FAQs
  {
    id: 41,
    question: 'How does MDBaise protect my medical information (HIPAA)?',
    answer: 'MDBaise implements comprehensive HIPAA-compliant security measures: all communications use end-to-end encryption, data is encrypted at rest using AES-256, we maintain detailed audit logs of all data access, access is strictly role-based, and we conduct regular security audits. Our systems comply with both Brazilian LGPD and US HIPAA regulations.',
    category: 'security'
  },
  {
    id: 42,
    question: 'What are audit logs and how do they protect me?',
    answer: 'Audit logs are automatic records of every action taken with your health data - who accessed it, when, and what they did. You can view your personal audit trail in Settings > Privacy > Data Access Log. This transparency ensures accountability and helps detect any unauthorized access to your medical information.',
    category: 'security'
  },
  {
    id: 43,
    question: 'How do patient consent forms work?',
    answer: 'Before any consultation, you\'ll be asked to sign digital consent forms covering treatment consent, data sharing permissions, and teleconsultation terms. You can review, sign, and manage all consent forms in your profile under "Consent Forms". Consents can be revoked at any time, and you\'ll receive copies of everything you sign.',
    category: 'security'
  },
  {
    id: 44,
    question: 'Is my data encrypted?',
    answer: 'Yes, all your data is protected with enterprise-grade encryption. Data in transit uses TLS 1.3 encryption, and data at rest uses AES-256 encryption. This includes your medical records, messages, video calls, and all personal information. Even our team cannot access your encrypted data without proper authorization.',
    category: 'security'
  },

  // Prescription Management FAQs
  {
    id: 45,
    question: 'How do I view my prescriptions?',
    answer: 'Access your prescriptions from Dashboard > Prescriptions. You\'ll see all active prescriptions with medication name, dosage, frequency, and instructions. You can also view prescription history, check refill status, and download prescriptions to share with pharmacies.',
    category: 'prescriptions'
  },
  {
    id: 46,
    question: 'How do I request a prescription refill?',
    answer: 'For medications with remaining refills, go to the prescription details and click "Request Refill". Your provider will be notified and typically responds within 24-48 hours. You\'ll receive a notification when the refill is approved and ready for pickup or delivery.',
    category: 'prescriptions'
  },
  {
    id: 47,
    question: 'Can I send my prescription to any pharmacy?',
    answer: 'Yes, you can send your e-prescription to any pharmacy that accepts electronic prescriptions. From the prescription details, click "Send to Pharmacy" and enter the pharmacy\'s details. Many pharmacies are already integrated for one-click sending.',
    category: 'prescriptions'
  },
  {
    id: 48,
    question: 'How long are prescriptions valid?',
    answer: 'Prescription validity depends on the medication type and your provider\'s settings. Most prescriptions are valid for 30-90 days. Controlled substances have stricter limits per regulations. Check the "Valid Until" date on each prescription for specific expiration.',
    category: 'prescriptions'
  },

  // Medical Records FAQs
  {
    id: 49,
    question: 'How do I upload medical records?',
    answer: 'Go to Dashboard > Medical Records and click "Upload Document". You can upload lab results, imaging reports, previous medical records, and health documents. Supported formats include PDF, JPG, PNG, and DICOM for medical imaging. All uploads are encrypted and securely stored.',
    category: 'records'
  },
  {
    id: 50,
    question: 'How do I share records with my doctor?',
    answer: 'When booking an appointment or during a consultation, you can select which records to share with your provider. Go to Medical Records, select the files, and click "Share". You can set time-limited access or permanent sharing. Revoke access anytime from the same menu.',
    category: 'records'
  },
  {
    id: 51,
    question: 'What types of medical records can I store?',
    answer: 'You can store: lab results, imaging reports (X-rays, MRIs, CT scans), vaccination records, allergy lists, medication history, surgical reports, hospital discharge summaries, specialist referrals, and any other health-related documents.',
    category: 'records'
  },
  {
    id: 52,
    question: 'Can I download all my medical records?',
    answer: 'Yes, you can export all your medical records at any time. Go to Settings > Privacy > Export My Data to download a complete copy of your health records, prescriptions, consultation notes, and other medical information in a portable format.',
    category: 'records'
  },

  // Insurance FAQs
  {
    id: 53,
    question: 'How do I add my insurance information?',
    answer: 'Go to Profile > Insurance and click "Add Insurance". Upload photos of your insurance card (front and back), enter your policy number, group number, and member ID. Your information will be verified automatically for most major insurance providers.',
    category: 'insurance'
  },
  {
    id: 54,
    question: 'How does insurance eligibility verification work?',
    answer: 'When you add your insurance or before booking with an insured provider, we perform real-time eligibility checks. You\'ll see your coverage status, estimated copay, deductible information, and which services are covered before you book.',
    category: 'insurance'
  },
  {
    id: 55,
    question: 'What if my insurance isn\'t accepted by a provider?',
    answer: 'You can still book with out-of-network providers and pay out-of-pocket. Some insurance plans offer out-of-network reimbursement - we provide itemized receipts you can submit for reimbursement. Check with your insurance about their out-of-network policies.',
    category: 'insurance'
  },
  {
    id: 56,
    question: 'How do I update or remove my insurance information?',
    answer: 'Go to Profile > Insurance to view your saved plans. Click on any insurance to edit details or upload new card images. To remove insurance, click the delete button. Changes take effect immediately for future bookings.',
    category: 'insurance'
  },

  // Appointment Reminders FAQs
  {
    id: 57,
    question: 'How do I set up appointment reminders?',
    answer: 'Go to Settings > Notifications > Appointment Reminders. You can choose reminder timing (24h, 2h, 30min before), select channels (email, SMS, push notification), and sync with your calendar (Google, Apple, Outlook). Reminders are on by default.',
    category: 'reminders'
  },
  {
    id: 58,
    question: 'Can I sync appointments with my calendar?',
    answer: 'Yes! When you book an appointment, you\'ll see an "Add to Calendar" option. You can also enable automatic sync in Settings > Calendar Integration to have all appointments appear in your Google Calendar, Apple Calendar, or Outlook automatically.',
    category: 'reminders'
  },
  {
    id: 59,
    question: 'How do I customize reminder timing?',
    answer: 'In Settings > Notifications > Reminder Timing, you can set exactly when you want to be reminded. Options range from 1 week before to 15 minutes before. You can set multiple reminders at different times for important appointments.',
    category: 'reminders'
  },
  {
    id: 60,
    question: 'Can providers send me custom reminders?',
    answer: 'Yes, providers can send preparation reminders with specific instructions (like fasting before blood tests). These appear as special notifications and are also stored in your appointment details. You\'ll receive them via your preferred notification channels.',
    category: 'reminders'
  }
];

// ===========================================
// TUTORIALS
// ===========================================

export const tutorials: Tutorial[] = [
  {
    id: 1,
    title: 'Complete Guide to Booking Your First Appointment',
    description: 'Learn how to search for doctors, compare profiles, and book your first appointment on MDBaise step by step.',
    category: 'patients',
    difficulty: 'Beginner',
    duration: '5 min read',
    prerequisites: ['Active MDBaise account'],
    outcomes: ['Successfully book an appointment', 'Understand the booking process', 'Know how to prepare for your visit'],
    steps: [
      {
        step: 1,
        title: 'Navigate to Find Doctors',
        content: 'From the homepage, click on "Find Doctors" in the navigation menu, or use the search bar directly on the homepage. You can also click "Explore" to browse all available healthcare providers.',
        tips: ['Use the mobile app for location-based recommendations', 'The search bar supports specialty names, doctor names, and conditions']
      },
      {
        step: 2,
        title: 'Search by Specialty or Condition',
        content: 'Enter the specialty you need (e.g., "Cardiology", "Dermatology") or describe your condition (e.g., "back pain", "skin rash"). The intelligent search will show relevant specialists and general practitioners who can help.',
        tips: ['Not sure which specialty? Search your symptoms and we\'ll suggest appropriate specialists', 'Popular specialties appear as quick-select buttons below the search bar']
      },
      {
        step: 3,
        title: 'Apply Filters to Narrow Results',
        content: 'Use the filter options to refine your search: Location/Distance (how far you\'re willing to travel), Availability (show only doctors with slots this week), Rating (minimum star rating), Price Range (budget-friendly to premium), Insurance (select your insurance plan), Consultation Type (in-person, teleconsultation, or both).',
        tips: ['Save your filter preferences for future searches', 'Enable "Verified Only" to see only credential-verified providers']
      },
      {
        step: 4,
        title: 'Review Doctor Profiles',
        content: 'Click on any doctor card to view their complete profile. Review their qualifications, years of experience, patient reviews, services offered, and pricing. Check the "About" section to understand their approach to patient care. Look at the photo gallery for their clinic/office environment.',
        tips: ['Read multiple reviews to get a balanced perspective', 'Check if they speak your preferred language', 'Verified badge means credentials are confirmed']
      },
      {
        step: 5,
        title: 'Select Appointment Type',
        content: 'Choose between "In-Person Consultation" (visit the clinic/hospital) or "Teleconsultation" (video call from home). Not all doctors offer both options - available types are shown on their profile. Consider your needs: physical exams require in-person, follow-ups often work well via video.',
        tips: ['Teleconsultations are often available sooner', 'First visits with a new doctor are often better in-person', 'Check if your insurance covers teleconsultations']
      },
      {
        step: 6,
        title: 'Pick Your Preferred Date and Time',
        content: 'The booking calendar shows available slots in green and unavailable times in gray. Select your preferred date first, then choose from available time slots. Morning, afternoon, and evening options may be available depending on the provider\'s schedule.',
        tips: ['Book at least 24 hours in advance for more options', 'Popular times (early morning, after work) fill up faster', 'Consider travel time for in-person appointments'],
        warnings: ['Some slots may be reserved for existing patients']
      },
      {
        step: 7,
        title: 'Add Appointment Details',
        content: 'Enter the reason for your visit - be specific so the doctor can prepare. Add any relevant medical history, current medications, or symptoms. You can attach documents like previous test results or referral letters. This information is confidential and only visible to your chosen provider.',
        tips: ['Detailed notes help doctors prepare better consultations', 'Upload test results in advance for more productive appointments']
      },
      {
        step: 8,
        title: 'Review and Confirm Payment',
        content: 'Review your booking summary: provider name, date/time, appointment type, and total cost. Enter your payment method (credit card, debit card, or PIX). Your card is authorized but not charged until after the consultation. Read and accept the terms of service, then click "Confirm Booking".',
        tips: ['Save your card for faster future bookings', 'Check the cancellation policy before confirming']
      },
      {
        step: 9,
        title: 'Receive Confirmation',
        content: 'After successful booking, you\'ll see a confirmation screen with your appointment details. You\'ll also receive a confirmation email and push notification. The appointment will appear in your Dashboard under "Upcoming Appointments". Add it to your phone calendar using the provided button.',
        tips: ['Screenshot the confirmation for your records', 'Enable notifications to receive reminders', 'Save the provider\'s contact info in case you need to communicate before the appointment']
      }
    ]
  },
  {
    id: 2,
    title: 'Setting Up Your Provider Profile for Success',
    description: 'A complete walkthrough for healthcare providers to create a professional profile that attracts patients and builds trust.',
    category: 'providers',
    difficulty: 'Beginner',
    duration: '15 min read',
    prerequisites: ['Active medical license (CRM)', 'Professional documentation ready', 'Profile photo'],
    outcomes: ['Complete, verified provider profile', 'Optimized for patient discovery', 'Ready to accept appointments'],
    steps: [
      {
        step: 1,
        title: 'Start Provider Registration',
        content: 'Click "Join" on the homepage and select "I\'m a Healthcare Provider". This begins a separate registration process designed for medical professionals. You\'ll need your CRM number and supporting documentation ready.',
        tips: ['Have your CRM certificate scanned and ready', 'Use your professional email address', 'Choose a strong, unique password']
      },
      {
        step: 2,
        title: 'Enter Your Professional Information',
        content: 'Fill in your legal name (as it appears on your CRM), CRM number and state, primary specialty, and years of experience. This information is verified against official medical board records. Enter your contact details for patient communications.',
        tips: ['Double-check your CRM number for accuracy', 'Your registered name must match official documents'],
        warnings: ['Incorrect CRM information will delay verification']
      },
      {
        step: 3,
        title: 'Upload Verification Documents',
        content: 'Upload clear, legible photos or scans of: CRM certificate (front and back), Medical school diploma, Specialty board certifications (if applicable), Professional ID photo. Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB per document.',
        tips: ['Ensure all text is readable in uploaded images', 'Documents must be current and not expired', 'Color scans process faster than black/white'],
        warnings: ['Blurry or partial documents will be rejected']
      },
      {
        step: 4,
        title: 'Create Your Professional Bio',
        content: 'Write a compelling bio (150-500 words) that introduces yourself to potential patients. Include your medical philosophy, areas of expertise, what makes your practice unique, languages spoken, and any special interests or research. Write in first person for a personal touch.',
        tips: ['Start with your most impressive qualification', 'Mention specific conditions you treat', 'Include your approach to patient care', 'Proofread carefully - this is your first impression']
      },
      {
        step: 5,
        title: 'Add Your Profile Photo',
        content: 'Upload a professional headshot photo. Guidelines: face clearly visible, professional attire (white coat recommended), neutral or medical setting background, good lighting, recent photo (within last 2 years). Your photo significantly impacts patient trust and booking rates.',
        tips: ['Professional photos increase bookings by 40%', 'Smile naturally - appear approachable', 'Avoid group photos or casual settings']
      },
      {
        step: 6,
        title: 'Configure Your Services',
        content: 'Add each service you offer. For each service specify: Name and description, Price (fixed, hourly, or quote-based), Duration (15, 30, 45, or 60 minutes), Whether it\'s available via teleconsultation, Any warranties or guarantees. Group related services into categories.',
        tips: ['Research competitor pricing in your area', 'Offer both premium and accessible options', 'Clearly describe what\'s included in each service']
      },
      {
        step: 7,
        title: 'Set Your Availability',
        content: 'Configure your weekly schedule: Set working days and hours, Define appointment slot duration, Add buffer time between appointments (recommended: 10-15 minutes), Block dates for vacation or personal time, Enable/disable same-day booking.',
        tips: ['Start with limited hours and expand as you grow', 'Morning slots are most popular', 'Leave lunch breaks in your schedule']
      },
      {
        step: 8,
        title: 'Add Practice Location(s)',
        content: 'Enter your practice address(es) for in-person consultations. Include: Full street address, Clinic/hospital name, Floor/suite number, Parking information, Public transit access. You can add multiple locations if you practice in different places.',
        tips: ['Add photos of your clinic exterior for easy recognition', 'Include accessibility information']
      },
      {
        step: 9,
        title: 'Configure Payment Settings',
        content: 'Set up how you receive payments: Enter bank account details for payouts, Select payout frequency (weekly/bi-weekly/monthly), Add accepted insurance plans, Configure cancellation policy and fees.',
        tips: ['Verify bank details carefully', 'A clear cancellation policy reduces no-shows']
      },
      {
        step: 10,
        title: 'Review and Publish',
        content: 'Preview your complete profile as patients will see it. Check all information for accuracy, ensure photos and documents are displaying correctly, verify your services and pricing are correct. Once satisfied, click "Submit for Review" to begin the verification process.',
        tips: ['Ask a colleague to review your profile', 'You can edit most information after publishing']
      }
    ]
  },
  {
    id: 3,
    title: 'Mastering Teleconsultation: Complete Guide',
    description: 'Everything patients and providers need to know about conducting effective video consultations on MDBaise.',
    category: 'patients',
    difficulty: 'Intermediate',
    duration: '8 min read',
    prerequisites: ['Booked teleconsultation appointment', 'Device with camera/microphone', 'Stable internet'],
    outcomes: ['Conduct smooth video consultations', 'Troubleshoot common issues', 'Get the most from virtual visits'],
    steps: [
      {
        step: 1,
        title: 'Verify Your Equipment (1 Day Before)',
        content: 'Check that your device has a working camera and microphone. For computers: open Camera app to test video, open Voice Recorder to test audio. For phones/tablets: ensure camera and microphone permissions are enabled for your browser. Test your internet speed at speedtest.net - you need at least 1.5 Mbps for smooth video.',
        tips: ['Use headphones for better audio quality', 'Wired internet is more stable than WiFi', 'Close other apps using internet bandwidth']
      },
      {
        step: 2,
        title: 'Prepare Your Environment',
        content: 'Choose a quiet, private room where you won\'t be interrupted. Ensure good lighting - sit facing a window or lamp, not with light behind you. Position your camera at eye level. Use a neutral background or use the virtual background feature. Inform household members of your appointment time.',
        tips: ['Natural light is most flattering', 'Test your background before the call', 'Put pets in another room']
      },
      {
        step: 3,
        title: 'Gather Your Medical Information',
        content: 'Have ready: list of current medications (with dosages), recent test results or medical records, list of symptoms and when they started, questions you want to ask the doctor, previous appointment notes if this is a follow-up. Upload any documents to your appointment beforehand.',
        tips: ['Write down your questions so you don\'t forget', 'Have your pharmacy information ready if prescriptions may be needed']
      },
      {
        step: 4,
        title: 'Join the Waiting Room (5 Minutes Early)',
        content: 'Log into MDBaise and go to "My Appointments". Find your teleconsultation and click "Join Call". Allow browser permissions for camera and microphone when prompted. You\'ll enter a virtual waiting room where you can preview your video and audio. The doctor will admit you when ready.',
        tips: ['Joining early gives you time to troubleshoot any issues', 'Use the preview to adjust lighting and position'],
        warnings: ['Don\'t be alarmed if you wait a few minutes - the doctor may be finishing with another patient']
      },
      {
        step: 5,
        title: 'During the Consultation',
        content: 'Speak clearly and at a moderate pace. Look at the camera (not the screen) to make eye contact. Describe symptoms thoroughly - where exactly, how severe (1-10), when it started, what makes it better/worse. Show affected areas to the camera if relevant. Take notes on the doctor\'s recommendations.',
        tips: ['Mute yourself when not speaking if there\'s background noise', 'Ask for clarification if you don\'t understand something', 'It\'s okay to have a family member present for support']
      },
      {
        step: 6,
        title: 'Share Documents or Images',
        content: 'Use the chat feature within the video call to share documents, test results, or images. Click the attachment icon and select files from your device. The doctor can view them during the call. You can also share your screen if you need to show something on your computer.',
        tips: ['Pre-upload documents to ensure they\'re ready', 'Take clear, well-lit photos of any physical symptoms beforehand']
      },
      {
        step: 7,
        title: 'End the Consultation Properly',
        content: 'Before ending, confirm: next steps (tests, referrals, follow-up), medication instructions, when to call if symptoms worsen, when to schedule a follow-up. Click "End Call" when finished. Rate your experience when prompted.',
        tips: ['Ask the doctor to summarize key points', 'Confirm you received any prescriptions electronically']
      },
      {
        step: 8,
        title: 'Access Your Consultation Summary',
        content: 'Within 1 hour of your consultation, you\'ll receive a summary in your Dashboard. This includes: diagnosis or assessment, prescribed medications, recommended tests or referrals, follow-up instructions, doctor\'s notes. Save or print this for your records.',
        tips: ['Review the summary for any questions', 'Contact support if you don\'t receive the summary']
      }
    ]
  },
  {
    id: 4,
    title: 'Responding to Quote Requests Effectively',
    description: 'For providers: Learn how to craft winning responses to patient quote requests and convert inquiries into appointments.',
    category: 'providers',
    difficulty: 'Intermediate',
    duration: '6 min read',
    prerequisites: ['Active provider account', 'Published profile'],
    outcomes: ['Respond professionally to inquiries', 'Increase conversion rate', 'Build patient relationships'],
    steps: [
      {
        step: 1,
        title: 'Monitor Your Quote Requests',
        content: 'Check your Provider Dashboard > Quote Requests regularly. Enable push notifications to receive instant alerts for new requests. The dashboard shows pending requests, those awaiting response, and your response rate statistics. Aim to respond within 2 hours for best results.',
        tips: ['Set aside specific times daily to review requests', 'Fast response time significantly improves conversion']
      },
      {
        step: 2,
        title: 'Understand the Patient\'s Needs',
        content: 'Carefully read the patient\'s request: What service are they seeking? What symptoms or concerns did they describe? What\'s their preferred timeline? Do they have insurance? What\'s their budget range (if provided)? Understanding their needs helps you craft a personalized response.',
        tips: ['Look for implicit needs beyond what\'s stated', 'Note any urgency indicators']
      },
      {
        step: 3,
        title: 'Prepare Your Response',
        content: 'Structure your response: 1) Acknowledge their concern, 2) Briefly introduce yourself and relevant experience, 3) Explain your proposed approach, 4) Provide clear pricing, 5) Offer next steps. Be professional but warm - patients choose providers they feel comfortable with.',
        tips: ['Personalize each response - avoid generic templates', 'Address their specific symptoms/concerns']
      },
      {
        step: 4,
        title: 'Set Competitive Pricing',
        content: 'Provide a clear price quote including: consultation fee, any additional costs that might apply, what\'s included (follow-up messages, prescription if needed), payment timing. If you offer packages or payment plans, mention those as options.',
        tips: ['Research competitor pricing in your area', 'Value-based pricing works better than cost-based', 'Be transparent about all potential costs']
      },
      {
        step: 5,
        title: 'Highlight Your Value Proposition',
        content: 'Differentiate yourself: mention relevant experience with their condition, your success rates or approach, unique aspects of your practice (same-day results, extended hours, bilingual), any guarantees you offer, patient satisfaction scores.',
        tips: ['Don\'t oversell - be genuine', 'Focus on patient benefits, not just features']
      },
      {
        step: 6,
        title: 'Submit and Follow Up',
        content: 'Review your response for professionalism and clarity, then submit. If the patient doesn\'t respond within 48 hours, send a polite follow-up message. Track which responses lead to bookings to refine your approach.',
        tips: ['Follow up shows you care', 'Learn from both successful and unsuccessful quotes']
      }
    ]
  },
  {
    id: 5,
    title: 'Managing Your Patient Dashboard',
    description: 'Learn to efficiently navigate your dashboard, manage appointments, track health history, and make the most of all features.',
    category: 'patients',
    difficulty: 'Beginner',
    duration: '4 min read',
    prerequisites: ['Active MDBaise account'],
    outcomes: ['Navigate dashboard efficiently', 'Manage all appointments', 'Track medical history'],
    steps: [
      {
        step: 1,
        title: 'Access Your Dashboard',
        content: 'Click on your profile avatar in the top right corner, or go directly to "Profile" in the navigation. Your dashboard is the central hub for all your MDBaise activity. It displays upcoming appointments, recent messages, health history, and personalized recommendations.',
        tips: ['Bookmark your dashboard for quick access', 'The dashboard updates in real-time']
      },
      {
        step: 2,
        title: 'View Upcoming Appointments',
        content: 'Your upcoming appointments appear at the top of the dashboard, sorted by date. Each card shows: provider name and photo, appointment date and time, consultation type (in-person/video), status (confirmed/pending). Click any appointment for full details.',
        tips: ['Add appointments to your phone calendar', 'Set multiple reminders for important appointments']
      },
      {
        step: 3,
        title: 'Manage Appointments',
        content: 'Click on any appointment to access options: View details (full appointment information), Join call (for teleconsultations, active 5 min before), Reschedule (select new date/time), Cancel (subject to provider\'s policy), Message provider (ask questions before appointment).',
        tips: ['Reschedule early if your plans change', 'Use messaging for non-urgent questions']
      },
      {
        step: 4,
        title: 'Review Appointment History',
        content: 'Scroll down or click "History" to see past appointments. Each includes: consultation summary, diagnoses, prescriptions issued, doctor\'s notes, receipts/invoices. Use the search and filter options to find specific visits.',
        tips: ['Download consultation summaries for your records', 'Review before follow-up appointments']
      },
      {
        step: 5,
        title: 'Manage Messages',
        content: 'Access your messages from the dashboard or "Messages" tab. All conversations with providers are organized by provider. You can send text messages, share documents, and receive appointment-related notifications. Messages are encrypted and private.',
        tips: ['Check messages for appointment prep instructions', 'Respond to provider messages promptly']
      },
      {
        step: 6,
        title: 'Track Favorites and Referrals',
        content: 'The "Favorites" section shows providers you\'ve saved. "Referrals" displays your referral code and tracks credits earned from successful referrals. Share your code to earn R$20 for each new user who completes an appointment.',
        tips: ['Favorite providers for quick rebooking', 'Share referral code on social media']
      }
    ]
  },
  {
    id: 6,
    title: 'Using the Social Feed and Going Live',
    description: 'For providers: Build your audience, share health content, and engage with potential patients through the social feed and live broadcasts.',
    category: 'providers',
    difficulty: 'Advanced',
    duration: '10 min read',
    prerequisites: ['Verified provider account', 'PRO or ELITE subscription'],
    outcomes: ['Create engaging content', 'Build follower base', 'Conduct live broadcasts'],
    steps: [
      {
        step: 1,
        title: 'Understanding the Social Feed',
        content: 'The Social Feed is MDBaise\'s content platform where providers share health tips, educational content, and updates. Patients can follow providers, like, and comment on posts. Great content increases your visibility and helps patients discover your practice.',
        tips: ['Consistent posting builds audience over time', 'Educational content performs best']
      },
      {
        step: 2,
        title: 'Create Your First Post',
        content: 'Go to Feed and click "Create Post". You can share: Text posts with health tips, Photos of your practice or infographics, Short videos (up to 3 minutes), Links to articles. Add relevant hashtags to increase discoverability. Include a call-to-action like "Book a consultation to learn more".',
        tips: ['Use high-quality images', 'Keep text concise and actionable', 'Post at peak times (lunch hours, evenings)']
      },
      {
        step: 3,
        title: 'Plan Your Content Strategy',
        content: 'Develop a content calendar: Educational posts (symptom awareness, prevention tips), Behind-the-scenes (your practice, team), Patient success stories (with permission), Health awareness days, Q&A sessions. Aim for 3-5 posts per week for optimal engagement.',
        tips: ['Batch-create content for efficiency', 'Mix content types to keep audience engaged']
      },
      {
        step: 4,
        title: 'Prepare for Going Live',
        content: 'Live broadcasts allow real-time interaction with your audience. Plan your topic and talking points, ensure good lighting and audio, test your equipment, promote the live session in advance. Lives are great for Q&A sessions, health talks, and building rapport.',
        tips: ['Go live at consistent times so followers know when to tune in', 'Have a moderator for busy streams']
      },
      {
        step: 5,
        title: 'Conduct a Live Broadcast',
        content: 'Click "Go Live" from the Feed. Add a title and description. Wait for viewers to join (promotion helps). Engage with comments in real-time. Share your expertise while maintaining professional boundaries. End with a call-to-action.',
        tips: ['Start with a hook to retain viewers', 'Acknowledge viewers by name', 'Save live replays for those who missed it']
      },
      {
        step: 6,
        title: 'Engage With Your Audience',
        content: 'Respond to comments on your posts, answer questions professionally, follow back other healthcare providers, share and comment on relevant content. Engagement builds community and increases your visibility in the algorithm.',
        tips: ['Set aside time daily for engagement', 'Be helpful, not promotional']
      }
    ]
  },
  {
    id: 7,
    title: 'Setting Up Insurance and Payments',
    description: 'Complete guide for providers to configure accepted insurance plans, pricing, and payment processing.',
    category: 'providers',
    difficulty: 'Intermediate',
    duration: '7 min read',
    prerequisites: ['Active provider account', 'Bank account details'],
    outcomes: ['Configure insurance acceptance', 'Set up payment processing', 'Understand payout system'],
    steps: [
      {
        step: 1,
        title: 'Navigate to Payment Settings',
        content: 'Go to Provider Dashboard > Settings > Payments. This section manages all financial aspects: accepted insurance, pricing, bank details, and payout preferences.',
        tips: ['Review settings quarterly', 'Keep bank details current']
      },
      {
        step: 2,
        title: 'Add Accepted Insurance Plans',
        content: 'Click "Add Insurance" and search for plans you\'re contracted with. For each plan, specify: Plan name and type, Your contracted rates (optional), Coverage verification process. Patients will see accepted insurance on your profile.',
        tips: ['Add all plans you accept', 'Update when you join or leave networks']
      },
      {
        step: 3,
        title: 'Configure Your Pricing',
        content: 'Set prices for each service you offer. Options: Fixed price (e.g., R$200 for consultation), Sliding scale (income-based), Insurance rate (billed to insurance), Quote-based (custom pricing). Be transparent about what\'s included.',
        tips: ['Research market rates', 'Consider offering consultation packages']
      },
      {
        step: 4,
        title: 'Set Up Bank Account for Payouts',
        content: 'Add your bank account for receiving payments: Bank name, Account type, Account number, CPF/CNPJ. Verify with micro-deposits if required. You can add multiple accounts and set a primary.',
        tips: ['Use a business account if available', 'Double-check all numbers']
      },
      {
        step: 5,
        title: 'Choose Payout Schedule',
        content: 'Select how often you receive payments: Weekly (every Friday), Bi-weekly, Monthly. Minimum payout threshold: R$50. Pending amounts below threshold roll over to the next payout.',
        tips: ['Weekly payouts help with cash flow', 'Monitor payout reports for accuracy']
      },
      {
        step: 6,
        title: 'Understand Fee Structure',
        content: 'Review platform fees: Transaction fee (5-10% depending on subscription), Payment processing fee (included in transaction fee). Fees are deducted before payout. View detailed breakdown in your earnings report.',
        tips: ['Higher subscription tiers have lower fees', 'Factor fees into your pricing']
      }
    ]
  },
  {
    id: 8,
    title: 'Advanced Search and Filters',
    description: 'Master all search features to find the perfect healthcare provider for your specific needs.',
    category: 'patients',
    difficulty: 'Intermediate',
    duration: '5 min read',
    prerequisites: [],
    outcomes: ['Find providers efficiently', 'Use advanced filters', 'Save search preferences'],
    steps: [
      {
        step: 1,
        title: 'Basic Search Techniques',
        content: 'The search bar accepts: Specialty names ("cardiologist"), Condition names ("diabetes"), Doctor names ("Dr. Silva"), Location ("São Paulo"). Results are ranked by relevance, rating, and proximity.',
        tips: ['Try different search terms', 'Broader searches show more results']
      },
      {
        step: 2,
        title: 'Location-Based Search',
        content: 'Enable location services for distance-based results. Or manually enter: City/neighborhood, Zip code, "Near me". Set maximum distance (1km to 50km). Use Map View for visual browsing.',
        tips: ['Consider travel time, not just distance', 'Some specialists are worth traveling for']
      },
      {
        step: 3,
        title: 'Filter by Availability',
        content: 'Availability filters: Available today, Available this week, Next available (shows soonest), Specific date range. Toggle teleconsultation/in-person preference. Show only providers accepting new patients.',
        tips: ['Flexible dates show more options', 'Urgent care providers often have same-day availability']
      },
      {
        step: 4,
        title: 'Filter by Provider Attributes',
        content: 'Refine by: Minimum rating (4+ stars recommended), Gender preference, Languages spoken, Years of experience, Verified credentials only. These filters help find providers you\'ll be comfortable with.',
        tips: ['Don\'t over-filter initially', 'Verified badge indicates credential confirmation']
      },
      {
        step: 5,
        title: 'Price and Insurance Filters',
        content: 'Set your budget range or select your insurance plan. Filter options: Price range (R$0-500+), Insurance accepted (select your plan), Free consultation (some offer free initial visits). Compare value, not just price.',
        tips: ['Check what\'s included in the price', 'Some plans have different copays for video vs in-person']
      },
      {
        step: 6,
        title: 'Save and Reuse Searches',
        content: 'After applying filters, click "Save Search" to store your preferences. Saved searches appear in your dashboard. Enable notifications to be alerted when new matching providers join.',
        tips: ['Create different saved searches for different needs', 'Update saved searches periodically']
      }
    ]
  }
];

// Continue in next part...
