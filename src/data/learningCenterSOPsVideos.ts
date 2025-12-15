// Learning Center Data - Part 2: SOPs and Videos
// Continues from learningCenterData.ts

import type { SOP, Video } from './learningCenterData';

// ===========================================
// STANDARD OPERATING PROCEDURES
// ===========================================

export const sops: SOP[] = [
  {
    id: 1,
    title: 'Patient Appointment Booking Procedure',
    code: 'SOP-PAT-001',
    version: '2.1',
    lastUpdated: '2024-12-01',
    category: 'patient',
    department: 'Patient Services',
    overview: 'Standard procedure for patients to search, select, and book appointments with healthcare providers on the MDBaise platform.',
    scope: 'All registered patients seeking medical consultations through MDBaise.',
    responsibilities: [
      'Patient: Provide accurate health information, select appropriate provider, complete booking process, arrive/join on time',
      'System: Display accurate availability, process payments securely, send confirmations and reminders',
      'Provider: Maintain current availability calendar, honor booked appointments, communicate any changes promptly'
    ],
    steps: [
      { step: 1, title: 'Account Access', description: 'Log into MDBaise account using registered email and password, or use Google/social login.', notes: 'Reset password via "Forgot Password" if needed. Create account if new user.', timeEstimate: '30 seconds' },
      { step: 2, title: 'Provider Search', description: 'Use search bar or browse categories to find healthcare providers by specialty, name, or condition.', notes: 'Apply filters for location, availability, insurance, and ratings.', timeEstimate: '1-3 minutes' },
      { step: 3, title: 'Profile Review', description: 'Review provider profile including credentials, experience, reviews, services, and pricing.', notes: 'Look for verified badge indicating credential confirmation.', timeEstimate: '2-5 minutes' },
      { step: 4, title: 'Service Selection', description: 'Choose the specific service needed from the provider\'s offerings.', notes: 'Note consultation type options: in-person vs teleconsultation.', timeEstimate: '30 seconds' },
      { step: 5, title: 'Schedule Selection', description: 'Select preferred date and time from available calendar slots.', notes: 'Green = available, Gray = unavailable. Consider travel time for in-person.', timeEstimate: '1 minute' },
      { step: 6, title: 'Information Entry', description: 'Enter reason for visit, relevant symptoms, and any medical history.', notes: 'This information helps providers prepare. Upload documents if relevant.', timeEstimate: '2-3 minutes' },
      { step: 7, title: 'Payment Processing', description: 'Review total cost and complete payment using stored or new payment method.', notes: 'Card is authorized at booking, charged after consultation completion.', timeEstimate: '1-2 minutes' },
      { step: 8, title: 'Confirmation Receipt', description: 'Verify booking confirmation on screen, via email, and in-app notification.', notes: 'Add appointment to personal calendar. Save confirmation details.', timeEstimate: '30 seconds' }
    ],
    qualityChecks: [
      'Confirmation email received within 5 minutes of booking',
      'Appointment visible in patient dashboard under "Upcoming"',
      'Payment authorization successful with transaction ID',
      'Calendar reminder automatically scheduled for 24 hours before',
      'Provider notified of new appointment'
    ],
    relatedSOPs: ['SOP-PAT-002 Teleconsultation', 'SOP-PAT-003 Appointment Changes']
  },
  {
    id: 2,
    title: 'Teleconsultation Execution Procedure',
    code: 'SOP-PAT-002',
    version: '1.8',
    lastUpdated: '2024-11-15',
    category: 'patient',
    department: 'Patient Services',
    overview: 'Standard procedure for patients to prepare for, join, and participate in video consultations with healthcare providers.',
    scope: 'All patients with scheduled teleconsultation appointments on MDBaise.',
    responsibilities: [
      'Patient: Prepare equipment, create appropriate environment, join on time, communicate clearly',
      'Provider: Join on time, maintain professional setting, document consultation, provide summary',
      'System: Provide stable encrypted connection, enable document sharing, record session details'
    ],
    steps: [
      { step: 1, title: 'Equipment Verification (24h before)', description: 'Test camera, microphone, speakers, and internet connection using device settings.', notes: 'Use system check tool in appointment details. Minimum 1.5 Mbps internet required.', timeEstimate: '5 minutes' },
      { step: 2, title: 'Environment Preparation (30 min before)', description: 'Select quiet, private, well-lit location. Position camera at eye level with neutral background.', notes: 'Face light source, not away from it. Minimize potential interruptions.', timeEstimate: '5 minutes' },
      { step: 3, title: 'Document Preparation (15 min before)', description: 'Gather medications list, symptoms notes, previous test results, and questions for doctor.', notes: 'Upload documents to appointment if not already done.', timeEstimate: '5-10 minutes' },
      { step: 4, title: 'Waiting Room Entry (5 min before)', description: 'Navigate to appointment in dashboard, click "Join Call", allow browser permissions.', notes: 'Preview your video/audio in waiting room. Provider will admit when ready.', timeEstimate: '2 minutes' },
      { step: 5, title: 'Consultation Conduct', description: 'Communicate clearly, describe symptoms thoroughly, show affected areas if relevant, take notes.', notes: 'Look at camera for eye contact. Ask clarifying questions. Don\'t rush.', timeEstimate: '15-60 minutes' },
      { step: 6, title: 'Document Sharing (if needed)', description: 'Use chat feature to share files, images, or test results during call.', notes: 'Screen share available for showing digital content.', timeEstimate: '1-3 minutes' },
      { step: 7, title: 'Consultation Conclusion', description: 'Confirm next steps, medication instructions, follow-up schedule. End call properly.', notes: 'Request summary of key points if needed.', timeEstimate: '2-3 minutes' },
      { step: 8, title: 'Post-Consultation Review', description: 'Access consultation summary in dashboard within 1 hour. Review prescriptions and instructions.', notes: 'Download summary for personal records. Contact support if summary missing.', timeEstimate: '5 minutes' }
    ],
    qualityChecks: [
      'Video and audio quality sufficient for clear communication throughout',
      'Consultation summary available in patient dashboard within 1 hour',
      'Prescriptions (if any) accessible and can be sent to pharmacy',
      'Follow-up appointment scheduled if recommended',
      'Patient satisfaction survey completed'
    ],
    relatedSOPs: ['SOP-PAT-001 Booking', 'SOP-EMG-001 Emergency Handling']
  },
  {
    id: 3,
    title: 'Provider Profile Setup and Verification',
    code: 'SOP-PRO-001',
    version: '3.0',
    lastUpdated: '2024-12-05',
    category: 'provider',
    department: 'Provider Operations',
    overview: 'Standard procedure for new healthcare providers to create, configure, and verify their professional profile on MDBaise.',
    scope: 'All healthcare providers registering on MDBaise platform.',
    responsibilities: [
      'Provider: Submit accurate information, upload valid credentials, maintain current profile, respond to verification requests',
      'Verification Team: Review credentials within 5 business days, request clarification if needed, approve or reject with reasoning',
      'System: Validate CRM format, store documents securely, display verification status, manage profile visibility'
    ],
    steps: [
      { step: 1, title: 'Registration Initiation', description: 'Click "Join" > "Healthcare Provider". Enter email, create password, accept terms.', notes: 'Use professional email. Password must be 8+ characters with numbers and symbols.', timeEstimate: '2 minutes' },
      { step: 2, title: 'Professional Information', description: 'Enter legal name, CRM number with state, primary specialty, medical school, graduation year.', notes: 'Name must match CRM certificate exactly. CRM format validated automatically.', timeEstimate: '3 minutes' },
      { step: 3, title: 'Document Upload', description: 'Upload CRM certificate, medical diploma, specialty certifications, professional photo.', notes: 'PDF/JPG/PNG accepted, max 10MB each. Documents must be clear and complete.', timeEstimate: '5 minutes' },
      { step: 4, title: 'Bio Creation', description: 'Write professional biography (150-500 words) covering expertise, approach, languages, interests.', notes: 'First person recommended. Include specific conditions treated. Proofread carefully.', timeEstimate: '10-15 minutes' },
      { step: 5, title: 'Service Configuration', description: 'Add services with names, descriptions, pricing (fixed/hourly/quote), duration, teleconsultation availability.', notes: 'Research competitive pricing. Be clear about what\'s included.', timeEstimate: '10-15 minutes' },
      { step: 6, title: 'Availability Setup', description: 'Set weekly schedule, appointment durations, buffer times, and blocked dates.', notes: 'Start conservative and expand. Morning slots most popular.', timeEstimate: '5 minutes' },
      { step: 7, title: 'Location Configuration', description: 'Add practice address(es), clinic name, floor/suite, parking info, accessibility details.', notes: 'Multiple locations supported. Add photos for patient recognition.', timeEstimate: '5 minutes' },
      { step: 8, title: 'Payment Setup', description: 'Add bank account details, select payout frequency, configure accepted insurance plans.', notes: 'Verify bank details carefully. Business account recommended.', timeEstimate: '5 minutes' },
      { step: 9, title: 'Review and Submit', description: 'Preview profile as patients see it. Verify all information. Submit for verification.', notes: 'Can edit most fields after submission. Verification takes 2-5 business days.', timeEstimate: '5 minutes' },
      { step: 10, title: 'Verification Completion', description: 'Respond to any verification team requests. Receive approval notification. Profile goes live.', notes: 'Check email and dashboard for verification status updates.', timeEstimate: '2-5 days' }
    ],
    qualityChecks: [
      'All required fields completed (100% profile completion meter)',
      'CRM number validated against official records',
      'Documents uploaded and legible',
      'At least one service configured with pricing',
      'Availability calendar has available slots',
      'Verification badge displayed after approval',
      'Profile appears in relevant search results'
    ],
    relatedSOPs: ['SOP-PRO-002 Availability Management', 'SOP-PRO-003 Service Updates']
  },
  {
    id: 4,
    title: 'Provider Availability Management',
    code: 'SOP-PRO-002',
    version: '2.2',
    lastUpdated: '2024-11-20',
    category: 'provider',
    department: 'Provider Operations',
    overview: 'Standard procedure for providers to manage their appointment availability, schedule changes, and time-off periods.',
    scope: 'All active providers with published profiles on MDBaise.',
    responsibilities: [
      'Provider: Maintain accurate availability, update schedule promptly, honor booked appointments',
      'System: Display real-time availability, prevent double-booking, sync calendar updates',
      'Patients: Book within displayed availability, check for updates before appointments'
    ],
    steps: [
      { step: 1, title: 'Access Availability Settings', description: 'Navigate to Provider Dashboard > Availability to view and edit your schedule.', notes: 'Changes apply immediately to booking calendar.', timeEstimate: '30 seconds' },
      { step: 2, title: 'Set Regular Hours', description: 'For each day, set working hours (start/end time) or mark as unavailable.', notes: 'Different hours allowed for different days. Include breaks.', timeEstimate: '3 minutes' },
      { step: 3, title: 'Configure Slot Duration', description: 'Set default appointment duration (15/30/45/60 minutes) per service type.', notes: 'Longer for initial consultations, shorter for follow-ups.', timeEstimate: '2 minutes' },
      { step: 4, title: 'Add Buffer Time', description: 'Set buffer between appointments (5-30 minutes) for notes, breaks, preparation.', notes: 'Recommended: 10-15 minutes minimum.', timeEstimate: '1 minute' },
      { step: 5, title: 'Block Specific Dates', description: 'Use calendar to block vacation days, conferences, or personal time.', notes: 'Can\'t block dates with existing appointments. Reschedule first.', timeEstimate: '2 minutes' },
      { step: 6, title: 'Enable/Disable Booking Types', description: 'Toggle same-day booking, advance booking limit (days), and consultation types.', notes: 'Consider your workflow when enabling same-day.', timeEstimate: '1 minute' },
      { step: 7, title: 'Save and Verify', description: 'Save changes and review calendar preview to ensure accuracy.', notes: 'Test by viewing your profile as a patient would.', timeEstimate: '2 minutes' }
    ],
    qualityChecks: [
      'Regular hours set for all working days',
      'Buffer time configured between appointments',
      'Blocked dates don\'t conflict with existing bookings',
      'Calendar displays correctly in patient-facing view',
      'Changes reflected immediately in search results'
    ],
    relatedSOPs: ['SOP-PRO-001 Profile Setup', 'SOP-PRO-004 Appointment Management']
  },
  {
    id: 5,
    title: 'Payment Processing and Payouts',
    code: 'SOP-FIN-001',
    version: '2.5',
    lastUpdated: '2024-11-20',
    category: 'admin',
    department: 'Finance',
    overview: 'Standard procedure for processing patient payments, calculating fees, and disbursing provider payouts.',
    scope: 'All financial transactions processed through MDBaise platform.',
    responsibilities: [
      'Patient: Maintain valid payment method, authorize payments, report issues promptly',
      'Provider: Complete consultations, confirm service delivery, verify payout amounts',
      'Finance Team: Process payouts on schedule, handle disputes, maintain transaction records',
      'System: Process payments securely, calculate fees, generate reports'
    ],
    steps: [
      { step: 1, title: 'Payment Authorization', description: 'When patient books, system authorizes full amount on their payment method.', notes: 'Authorization holds for 7 days. No charge yet, just validation.', timeEstimate: 'Automatic' },
      { step: 2, title: 'Appointment Completion', description: 'Provider marks consultation as complete after service delivery.', notes: 'Patient receives prompt to confirm. Disputes must be raised within 24 hours.', timeEstimate: '1 minute' },
      { step: 3, title: 'Payment Capture', description: 'System captures authorized payment amount after mutual confirmation.', notes: 'Capture occurs automatically 24 hours after completion if no disputes.', timeEstimate: 'Automatic' },
      { step: 4, title: 'Fee Calculation', description: 'Platform fee (5-10% based on subscription) deducted from payment.', notes: 'Fee breakdown visible in transaction details. Lower fees for higher tiers.', timeEstimate: 'Automatic' },
      { step: 5, title: 'Balance Update', description: 'Net amount added to provider\'s available balance.', notes: 'Balance visible in Provider Dashboard > Payouts.', timeEstimate: 'Automatic' },
      { step: 6, title: 'Payout Processing', description: 'System initiates bank transfer on scheduled payout day (weekly Friday default).', notes: 'Minimum R$50 threshold. Below minimum rolls to next payout.', timeEstimate: '1-3 business days' },
      { step: 7, title: 'Confirmation', description: 'Provider receives payout confirmation via email with breakdown.', notes: 'Bank deposits typically visible within 1-3 business days.', timeEstimate: 'Varies by bank' }
    ],
    qualityChecks: [
      'Payment authorization successful at booking',
      'Transaction recorded in both patient and provider accounts',
      'Fee calculation matches subscription tier rates',
      'Payout reflected in provider balance within 24 hours of completion',
      'Bank transfer initiated on scheduled payout day',
      'Receipts/invoices generated and accessible to both parties'
    ],
    relatedSOPs: ['SOP-FIN-002 Refund Processing', 'SOP-FIN-003 Dispute Resolution']
  },
  {
    id: 6,
    title: 'Refund Request Processing',
    code: 'SOP-FIN-002',
    version: '1.6',
    lastUpdated: '2024-11-25',
    category: 'admin',
    department: 'Finance',
    overview: 'Standard procedure for handling patient refund requests due to cancellations, no-shows, or service issues.',
    scope: 'All refund requests submitted through MDBaise platform.',
    responsibilities: [
      'Patient: Submit refund request with valid reason, provide supporting information',
      'Provider: Respond to disputes, honor cancellation policies',
      'Support Team: Review requests, apply policies consistently, communicate decisions',
      'System: Track requests, process approved refunds, update records'
    ],
    steps: [
      { step: 1, title: 'Request Submission', description: 'Patient submits refund request via appointment details > Request Refund.', notes: 'Reason selection required. Supporting details improve processing speed.', timeEstimate: '2 minutes' },
      { step: 2, title: 'Automatic Evaluation', description: 'System checks against provider\'s cancellation policy for automatic eligibility.', notes: 'Cancellations 24h+ before = automatic full refund typically.', timeEstimate: 'Automatic' },
      { step: 3, title: 'Manual Review (if needed)', description: 'Support team reviews requests not meeting automatic criteria.', notes: 'Review considers: timing, reason, history, provider response.', timeEstimate: '1-2 business days' },
      { step: 4, title: 'Provider Notification', description: 'Provider notified of refund request, given opportunity to respond.', notes: 'Provider has 48 hours to dispute or provide information.', timeEstimate: '48 hours max' },
      { step: 5, title: 'Decision Communication', description: 'Patient notified of refund decision via email and in-app notification.', notes: 'Decision includes reasoning and any partial amounts.', timeEstimate: 'Same day as decision' },
      { step: 6, title: 'Refund Processing', description: 'Approved refunds processed to original payment method.', notes: 'Credit card refunds: 5-10 business days. PIX: 1-2 business days.', timeEstimate: '1-10 business days' },
      { step: 7, title: 'Record Update', description: 'Transaction records updated, provider balance adjusted if already paid.', notes: 'Full audit trail maintained for all refund transactions.', timeEstimate: 'Automatic' }
    ],
    qualityChecks: [
      'Refund request acknowledged within 24 hours',
      'Decision made within 3 business days',
      'Patient notified of outcome with clear explanation',
      'Refund processed within stated timeframes',
      'Records accurately reflect refund status',
      'Provider balance correctly adjusted'
    ],
    relatedSOPs: ['SOP-FIN-001 Payment Processing', 'SOP-FIN-003 Disputes']
  },
  {
    id: 7,
    title: 'Emergency Escalation Protocol',
    code: 'SOP-EMG-001',
    version: '1.2',
    lastUpdated: '2024-10-30',
    category: 'emergency',
    department: 'Safety & Compliance',
    overview: 'Standard procedure for identifying and responding to medical emergencies during teleconsultations or platform interactions.',
    scope: 'All emergency situations identified during patient-provider interactions on MDBaise.',
    responsibilities: [
      'Provider: Recognize emergency signs, guide patient, contact emergency services if needed, document incident',
      'Patient/Caregiver: Follow instructions, provide location, call emergency services when directed',
      'Support Team: Assist coordination if contacted, follow up on incidents',
      'System: Maintain connection during emergencies, log incident details'
    ],
    steps: [
      { step: 1, title: 'Emergency Recognition', description: 'Identify signs of medical emergency: chest pain, breathing difficulty, stroke symptoms (FAST), severe bleeding, loss of consciousness, severe allergic reaction.', notes: 'When in doubt, treat as emergency. Patient safety is priority.', timeEstimate: 'Immediate' },
      { step: 2, title: 'Direct Emergency Call', description: 'Instruct patient/caregiver to call 192 (SAMU) or 193 (Fire/Rescue) immediately while you stay on line.', notes: 'If alone, patient should call emergency services first. Stay calm.', timeEstimate: 'Immediate' },
      { step: 3, title: 'Gather Location', description: 'Confirm patient\'s exact location: full address, apartment/building number, landmarks.', notes: 'Ask for this early in case connection drops. Write it down.', timeEstimate: '1 minute' },
      { step: 4, title: 'Provide Guidance', description: 'Give appropriate first aid guidance while waiting: positioning, CPR instructions if needed, what NOT to do.', notes: 'Only advise within your competence. Keep patient calm.', timeEstimate: 'Until help arrives' },
      { step: 5, title: 'Stay Connected', description: 'Maintain video/audio connection as long as possible. Document timeline and instructions given.', notes: 'If connection drops, try to reconnect. Record what happened.', timeEstimate: 'Until resolved' },
      { step: 6, title: 'Emergency Handoff', description: 'When emergency services arrive, provide relevant medical history to responders if possible.', notes: 'Offer to speak with paramedics if helpful.', timeEstimate: 'As needed' },
      { step: 7, title: 'Incident Documentation', description: 'Complete incident report within 24 hours via Provider Dashboard > Incidents.', notes: 'Include: timeline, symptoms, instructions given, outcome.', timeEstimate: '15-30 minutes' },
      { step: 8, title: 'Follow-Up', description: 'If appropriate and possible, follow up on patient status. Report to MDBaise support team.', notes: 'Maintain confidentiality. Debrief if needed for personal wellbeing.', timeEstimate: 'Next business day' }
    ],
    qualityChecks: [
      'Emergency services contacted within 2 minutes of recognition',
      'Patient/caregiver location confirmed and documented',
      'Provider remained available until help arrived or situation resolved',
      'Incident report filed within 24 hours',
      'Follow-up attempted where appropriate',
      'Support team notified of serious incidents'
    ],
    relatedSOPs: ['SOP-PAT-002 Teleconsultation', 'SOP-SEC-002 Incident Response']
  },
  {
    id: 8,
    title: 'Patient Data Security Protocol',
    code: 'SOP-SEC-001',
    version: '2.0',
    lastUpdated: '2024-12-01',
    category: 'admin',
    department: 'Information Security',
    overview: 'Standard procedure for protecting patient health information (PHI) and ensuring LGPD/HIPAA compliance across all platform operations.',
    scope: 'All users and systems handling patient data on MDBaise.',
    responsibilities: [
      'All Users: Follow data handling protocols, report suspicious activity, complete security training',
      'IT Team: Maintain security infrastructure, monitor for threats, respond to incidents',
      'Compliance Team: Conduct audits, update policies, ensure regulatory compliance',
      'Management: Enforce policies, allocate security resources, respond to breaches'
    ],
    steps: [
      { step: 1, title: 'Data Classification', description: 'Identify data sensitivity level: PHI (protected health information), PII (personal identifiable information), or General.', notes: 'PHI includes: diagnoses, treatments, medications, test results. Apply highest protection.', timeEstimate: 'Ongoing' },
      { step: 2, title: 'Access Control', description: 'Verify user has legitimate need and authorization before accessing patient data.', notes: 'Minimum necessary principle: access only what\'s needed for the task.', timeEstimate: 'Per access' },
      { step: 3, title: 'Secure Transmission', description: 'Use only encrypted channels (TLS 1.3+) for transmitting patient data.', notes: 'Never send PHI via unencrypted email, SMS, or messaging apps.', timeEstimate: 'Always' },
      { step: 4, title: 'Data Storage', description: 'Store patient data only in approved, encrypted systems. No local storage of PHI.', notes: 'Cloud storage must be LGPD/HIPAA compliant. Regular backup verification.', timeEstimate: 'Ongoing' },
      { step: 5, title: 'Authentication', description: 'Use strong passwords, enable two-factor authentication, never share credentials.', notes: 'Report lost devices immediately. Lock screens when away.', timeEstimate: 'Always' },
      { step: 6, title: 'Incident Reporting', description: 'Report any suspected data breach, unauthorized access, or security concern immediately.', notes: 'Contact security@mdbaise.com or use in-app reporting. Do not investigate alone.', timeEstimate: 'Immediate' },
      { step: 7, title: 'Regular Training', description: 'Complete annual security awareness training. Stay informed of new threats and policies.', notes: 'Training completion is mandatory for platform access.', timeEstimate: 'Annual + updates' }
    ],
    qualityChecks: [
      'All data transmissions encrypted (TLS 1.3+)',
      'Access logs reviewed weekly for anomalies',
      'No unauthorized access attempts detected',
      'All users completed current security training',
      'Backup integrity verified monthly',
      'Penetration testing passed quarterly'
    ],
    relatedSOPs: ['SOP-SEC-002 Incident Response', 'SOP-SEC-003 Backup Recovery']
  },
  {
    id: 9,
    title: 'Provider Review Response Protocol',
    code: 'SOP-PRO-005',
    version: '1.4',
    lastUpdated: '2024-11-15',
    category: 'provider',
    department: 'Provider Operations',
    overview: 'Standard procedure for providers to professionally respond to patient reviews and maintain reputation.',
    scope: 'All provider responses to patient reviews on MDBaise.',
    responsibilities: [
      'Provider: Respond professionally to all reviews, address concerns constructively',
      'Quality Team: Monitor responses for policy compliance, mediate disputes',
      'System: Notify providers of new reviews, display responses publicly'
    ],
    steps: [
      { step: 1, title: 'Review Notification', description: 'Receive notification of new review via email and dashboard alert.', notes: 'Reviews visible in Provider Dashboard > Reviews. Enable notifications.', timeEstimate: 'Automatic' },
      { step: 2, title: 'Review Assessment', description: 'Read review carefully. Identify key points, sentiment, and any specific issues raised.', notes: 'Don\'t react emotionally. Take time to consider response.', timeEstimate: '5 minutes' },
      { step: 3, title: 'Response Drafting', description: 'Write professional response: thank reviewer, address specific points, offer resolution if applicable.', notes: 'Keep patient confidentiality. Don\'t discuss medical details publicly.', timeEstimate: '10-15 minutes' },
      { step: 4, title: 'Tone Check', description: 'Review response for professional tone. Avoid defensive or argumentative language.', notes: 'Read aloud. Ask colleague to review if unsure.', timeEstimate: '5 minutes' },
      { step: 5, title: 'Response Submission', description: 'Submit response via dashboard. Response appears publicly under the review.', notes: 'Responses cannot be edited after submission. Draft carefully.', timeEstimate: '1 minute' },
      { step: 6, title: 'Follow-Up Action', description: 'If review reveals operational issues, implement improvements. Document changes made.', notes: 'Negative reviews often highlight real improvement opportunities.', timeEstimate: 'As needed' }
    ],
    qualityChecks: [
      'Response submitted within 48 hours of review',
      'Professional, constructive tone maintained',
      'No patient confidential information disclosed',
      'Specific concerns addressed where possible',
      'Policy-violating reviews reported appropriately'
    ],
    relatedSOPs: ['SOP-PRO-001 Profile Management', 'SOP-QUA-001 Service Quality']
  },
  {
    id: 10,
    title: 'Appointment Cancellation and Rescheduling',
    code: 'SOP-PAT-003',
    version: '2.0',
    lastUpdated: '2024-11-30',
    category: 'patient',
    department: 'Patient Services',
    overview: 'Standard procedure for patients to cancel or reschedule existing appointments.',
    scope: 'All confirmed appointments that need to be changed.',
    responsibilities: [
      'Patient: Request changes as early as possible, understand cancellation policy',
      'Provider: Set clear cancellation policies, accommodate reschedules when possible',
      'System: Process changes, apply policies, update calendars, handle refunds'
    ],
    steps: [
      { step: 1, title: 'Access Appointment', description: 'Go to Dashboard > My Appointments. Find and click on the appointment to change.', notes: 'Can also access from confirmation email link.', timeEstimate: '30 seconds' },
      { step: 2, title: 'Review Policy', description: 'Check provider\'s cancellation policy displayed on appointment details.', notes: 'Typical: 24h notice for full refund, less notice may incur fees.', timeEstimate: '1 minute' },
      { step: 3, title: 'Select Action', description: 'Choose "Reschedule" to change time, or "Cancel" to cancel entirely.', notes: 'Rescheduling often has more flexible policies than cancellation.', timeEstimate: '30 seconds' },
      { step: 4, title: 'For Rescheduling', description: 'Select new date and time from available slots. Confirm the change.', notes: 'Same service and provider. For different provider, cancel and rebook.', timeEstimate: '2 minutes' },
      { step: 5, title: 'For Cancellation', description: 'Select cancellation reason. Confirm cancellation understanding any applicable fees.', notes: 'Reason helps improve service but is optional.', timeEstimate: '1 minute' },
      { step: 6, title: 'Confirmation', description: 'Receive confirmation of change via screen, email, and notification.', notes: 'Original calendar event updated automatically if synced.', timeEstimate: 'Immediate' },
      { step: 7, title: 'Refund Processing', description: 'If eligible for refund, processed automatically per policy terms.', notes: 'Refund timeframe depends on payment method.', timeEstimate: '1-10 business days' }
    ],
    qualityChecks: [
      'Change confirmation received immediately',
      'Provider notified of cancellation/reschedule',
      'Calendar updated accurately',
      'Refund processed per stated policy',
      'Appointment slot released for other patients'
    ],
    relatedSOPs: ['SOP-PAT-001 Booking', 'SOP-FIN-002 Refunds']
  },
  // NEW: HIPAA Compliance SOPs
  {
    id: 11,
    title: 'HIPAA Compliance and Data Protection',
    code: 'SOP-SEC-002',
    version: '1.0',
    lastUpdated: '2024-12-10',
    category: 'admin',
    department: 'Compliance',
    overview: 'Standard procedure for maintaining HIPAA compliance, protecting patient health information, and ensuring regulatory adherence.',
    scope: 'All staff, providers, and systems handling protected health information (PHI).',
    responsibilities: [
      'All Users: Follow data protection protocols, complete HIPAA training, report incidents',
      'Compliance Team: Monitor compliance, conduct audits, manage training programs',
      'IT Security: Implement technical safeguards, monitor access logs, respond to breaches',
      'Providers: Obtain proper consent, limit data access to minimum necessary, secure communications'
    ],
    steps: [
      { step: 1, title: 'Data Classification', description: 'Identify and classify all data as PHI, PII, or general. PHI requires highest protection level.', notes: 'PHI includes diagnoses, treatments, prescriptions, lab results.', timeEstimate: 'Ongoing' },
      { step: 2, title: 'Access Controls', description: 'Implement role-based access. Users only access data necessary for their function.', notes: 'Regular access reviews required. Remove access when no longer needed.', timeEstimate: 'Per access request' },
      { step: 3, title: 'Encryption Verification', description: 'Ensure all PHI is encrypted in transit (TLS 1.3) and at rest (AES-256).', notes: 'Never transmit PHI via unencrypted channels.', timeEstimate: 'System level' },
      { step: 4, title: 'Audit Logging', description: 'Maintain detailed logs of all PHI access, modifications, and transmissions.', notes: 'Logs retained for 6 years per HIPAA requirements.', timeEstimate: 'Automatic' },
      { step: 5, title: 'Consent Management', description: 'Obtain documented consent before collecting or sharing PHI. Provide privacy notices.', notes: 'Digital signatures are legally binding. Store consent records securely.', timeEstimate: 'Per patient interaction' },
      { step: 6, title: 'Incident Response', description: 'Report any potential breach within 24 hours. Follow breach notification procedures if confirmed.', notes: 'Breaches affecting 500+ individuals require public notification.', timeEstimate: 'Immediate' },
      { step: 7, title: 'Training Compliance', description: 'Complete annual HIPAA training. Maintain training records for all staff.', notes: 'New employees trained within 30 days of hire.', timeEstimate: 'Annual' }
    ],
    qualityChecks: [
      'All staff completed HIPAA training within required timeframe',
      'Access controls reviewed quarterly',
      'Audit logs reviewed monthly for anomalies',
      'Consent forms obtained before all consultations',
      'Encryption verified for all data transmissions',
      'Incident response plan tested annually'
    ],
    relatedSOPs: ['SOP-SEC-001 Data Security', 'SOP-EMG-002 Breach Response']
  },
  {
    id: 12,
    title: 'Patient Consent Form Management',
    code: 'SOP-CON-001',
    version: '1.0',
    lastUpdated: '2024-12-10',
    category: 'patient',
    department: 'Patient Services',
    overview: 'Standard procedure for presenting, collecting, and managing patient consent forms for treatment and data sharing.',
    scope: 'All patient interactions requiring informed consent.',
    responsibilities: [
      'Patient: Review and sign consent forms, ask questions if unclear, manage consents',
      'Provider: Present appropriate consent forms, explain terms, document signed consents',
      'System: Display forms, capture signatures, store securely, track consent status'
    ],
    steps: [
      { step: 1, title: 'Form Presentation', description: 'Display appropriate consent form before consultation begins. Forms include treatment consent, data sharing, and teleconsultation terms.', notes: 'Forms must be accessible and readable on all devices.', timeEstimate: '1 minute' },
      { step: 2, title: 'Patient Review', description: 'Allow patient time to read entire form. Provide explanation of key terms if requested.', notes: 'Never rush consent process. Answer all questions.', timeEstimate: '2-5 minutes' },
      { step: 3, title: 'Digital Signature', description: 'Patient signs electronically using finger/stylus on mobile or typed signature on desktop.', notes: 'Capture timestamp, IP address, and device info with signature.', timeEstimate: '30 seconds' },
      { step: 4, title: 'Confirmation', description: 'Display confirmation of signed consent. Provide downloadable copy.', notes: 'Copy also sent via email automatically.', timeEstimate: 'Immediate' },
      { step: 5, title: 'Secure Storage', description: 'Store signed consent in encrypted patient record. Link to relevant appointment/consultation.', notes: 'Consents retained per regulatory requirements (typically 7 years).', timeEstimate: 'Automatic' },
      { step: 6, title: 'Consent Management', description: 'Patient can view all consents in profile. Option to revoke applicable consents.', notes: 'Some consents cannot be revoked retroactively.', timeEstimate: 'As needed' }
    ],
    qualityChecks: [
      'Consent obtained before consultation begins',
      'All required consent types collected',
      'Patient received copy of signed consent',
      'Consent linked to appropriate medical record',
      'Revocation requests processed within 24 hours'
    ],
    relatedSOPs: ['SOP-SEC-002 HIPAA Compliance', 'SOP-PAT-001 Booking']
  },
  // NEW: Prescription Management SOPs
  {
    id: 13,
    title: 'E-Prescription Management',
    code: 'SOP-RX-001',
    version: '1.0',
    lastUpdated: '2024-12-10',
    category: 'provider',
    department: 'Clinical Operations',
    overview: 'Standard procedure for creating, managing, and transmitting electronic prescriptions.',
    scope: 'All licensed providers authorized to prescribe medications.',
    responsibilities: [
      'Provider: Verify patient identity, prescribe appropriately, monitor medication history',
      'Patient: Verify prescription accuracy, report adverse reactions, request refills properly',
      'System: Validate prescriptions, transmit to pharmacies, track refills and expirations',
      'Pharmacy: Receive e-prescriptions, verify accuracy, dispense medications'
    ],
    steps: [
      { step: 1, title: 'Patient Verification', description: 'Confirm patient identity and review current medication list and allergies.', notes: 'Check for drug interactions before prescribing.', timeEstimate: '2 minutes' },
      { step: 2, title: 'Prescription Creation', description: 'Enter medication name, dosage, frequency, duration, quantity, and refills allowed.', notes: 'Use standard medication database for accuracy.', timeEstimate: '2-3 minutes' },
      { step: 3, title: 'Clinical Review', description: 'System checks for drug interactions, allergies, and dosing appropriateness.', notes: 'Override requires documentation of clinical justification.', timeEstimate: '30 seconds' },
      { step: 4, title: 'Digital Signature', description: 'Provider authenticates and signs prescription electronically.', notes: 'Two-factor authentication required for controlled substances.', timeEstimate: '30 seconds' },
      { step: 5, title: 'Pharmacy Transmission', description: 'E-prescription transmitted to patient\'s selected pharmacy.', notes: 'Patient can choose pharmacy or pick up paper prescription.', timeEstimate: 'Immediate' },
      { step: 6, title: 'Patient Notification', description: 'Patient receives notification with prescription details and pharmacy information.', notes: 'Instructions included in patient-facing summary.', timeEstimate: 'Immediate' },
      { step: 7, title: 'Refill Management', description: 'System tracks refills used and remaining. Patient can request refills through portal.', notes: 'Provider reviews and approves refill requests.', timeEstimate: 'As needed' }
    ],
    qualityChecks: [
      'Patient allergies verified before prescribing',
      'Drug interaction check completed',
      'Prescription accurately transmitted to pharmacy',
      'Patient received prescription notification',
      'Refill tracking accurate and current',
      'Controlled substance prescriptions comply with regulations'
    ],
    relatedSOPs: ['SOP-PAT-002 Teleconsultation', 'SOP-CON-001 Consent']
  },
  // NEW: Medical Records SOPs
  {
    id: 14,
    title: 'Medical Records Management',
    code: 'SOP-MR-001',
    version: '1.0',
    lastUpdated: '2024-12-10',
    category: 'admin',
    department: 'Health Information',
    overview: 'Standard procedure for uploading, organizing, sharing, and securing patient medical records.',
    scope: 'All medical documents, lab results, imaging, and health records.',
    responsibilities: [
      'Patient: Upload accurate records, manage sharing permissions, verify document ownership',
      'Provider: Review shared records, add clinical notes, maintain record accuracy',
      'System: Store securely, validate formats, manage access permissions, enable sharing',
      'HIM Team: Audit records, ensure compliance, respond to record requests'
    ],
    steps: [
      { step: 1, title: 'Document Upload', description: 'Patient uploads document via Medical Records section. Supported: PDF, images, DICOM.', notes: 'Maximum file size 50MB. Automatic virus scan on upload.', timeEstimate: '1-3 minutes' },
      { step: 2, title: 'Document Classification', description: 'Categorize document type: lab result, imaging, prescription, clinical note, etc.', notes: 'AI-assisted classification suggested, patient confirms.', timeEstimate: '30 seconds' },
      { step: 3, title: 'Metadata Entry', description: 'Add document date, source facility, ordering provider if applicable.', notes: 'Accurate metadata improves searchability and organization.', timeEstimate: '1 minute' },
      { step: 4, title: 'Secure Storage', description: 'Document encrypted and stored in patient\'s secure health record.', notes: 'Data redundancy ensures no loss. Accessible indefinitely.', timeEstimate: 'Automatic' },
      { step: 5, title: 'Sharing Configuration', description: 'Patient sets sharing permissions: which providers, for how long.', notes: 'Default is private. Sharing requires explicit action.', timeEstimate: '1 minute' },
      { step: 6, title: 'Access Logging', description: 'All access to records logged with viewer identity, timestamp, and action.', notes: 'Patient can view access log anytime.', timeEstimate: 'Automatic' },
      { step: 7, title: 'Export/Download', description: 'Patient can download individual documents or entire record set.', notes: 'Export formats: PDF bundle or FHIR standard for interoperability.', timeEstimate: '1-5 minutes' }
    ],
    qualityChecks: [
      'All uploads encrypted before storage',
      'Document classification accurate',
      'Sharing permissions correctly applied',
      'Access logs complete and accurate',
      'Export functionality working correctly',
      'HIPAA-compliant retention policies enforced'
    ],
    relatedSOPs: ['SOP-SEC-002 HIPAA Compliance', 'SOP-CON-001 Consent']
  },
  // NEW: Insurance Verification SOPs
  {
    id: 15,
    title: 'Insurance Eligibility Verification',
    code: 'SOP-INS-001',
    version: '1.0',
    lastUpdated: '2024-12-10',
    category: 'admin',
    department: 'Revenue Cycle',
    overview: 'Standard procedure for verifying patient insurance eligibility and coverage details.',
    scope: 'All patients with insurance seeking covered services.',
    responsibilities: [
      'Patient: Provide accurate insurance information, upload current cards, report changes',
      'System: Verify eligibility in real-time, display coverage details, calculate patient responsibility',
      'Provider: Review coverage before treatment, bill appropriately',
      'Billing Team: Process claims, follow up on denials, update coverage records'
    ],
    steps: [
      { step: 1, title: 'Insurance Entry', description: 'Patient enters insurance details: provider, policy number, group number, member ID.', notes: 'Upload card images for verification reference.', timeEstimate: '2-3 minutes' },
      { step: 2, title: 'Card Image Capture', description: 'Patient uploads photos of insurance card front and back.', notes: 'OCR extracts data to reduce manual entry errors.', timeEstimate: '1 minute' },
      { step: 3, title: 'Eligibility Check', description: 'System queries payer database for real-time eligibility verification.', notes: 'Results typically returned within 5-15 seconds.', timeEstimate: '15 seconds' },
      { step: 4, title: 'Coverage Display', description: 'Show patient: active/inactive status, deductible, copay, covered services.', notes: 'Estimated costs displayed before booking.', timeEstimate: 'Immediate' },
      { step: 5, title: 'Service Verification', description: 'Confirm specific service is covered under patient\'s plan.', notes: 'Some services require prior authorization.', timeEstimate: '1 minute' },
      { step: 6, title: 'Cost Estimate', description: 'Calculate and display estimated patient responsibility based on coverage.', notes: 'Actual costs may vary based on services rendered.', timeEstimate: 'Automatic' },
      { step: 7, title: 'Documentation', description: 'Store verification results for billing reference and audit trail.', notes: 'Re-verify for services 30+ days after initial check.', timeEstimate: 'Automatic' }
    ],
    qualityChecks: [
      'Insurance information accurately entered',
      'Eligibility verified within 24 hours of appointment',
      'Coverage details correctly displayed to patient',
      'Cost estimates within 10% of actual charges',
      'Prior authorization obtained when required',
      'Verification documented for billing compliance'
    ],
    relatedSOPs: ['SOP-FIN-001 Payment Processing', 'SOP-PAT-001 Booking']
  },
  // NEW: Appointment Reminders SOPs
  {
    id: 16,
    title: 'Appointment Reminder System',
    code: 'SOP-REM-001',
    version: '1.0',
    lastUpdated: '2024-12-10',
    category: 'admin',
    department: 'Patient Engagement',
    overview: 'Standard procedure for configuring and delivering appointment reminders via multiple channels.',
    scope: 'All confirmed appointments requiring patient notification.',
    responsibilities: [
      'Patient: Configure preferred reminder settings, act on reminders, update contact info',
      'System: Send reminders at configured times, track delivery status, log interactions',
      'Provider: Set appointment-specific instructions, customize reminder templates'
    ],
    steps: [
      { step: 1, title: 'Preference Configuration', description: 'Patient sets reminder preferences: timing (24h, 2h, 30min), channels (email, SMS, push).', notes: 'Default: email 24h before, push 2h before.', timeEstimate: '2 minutes' },
      { step: 2, title: 'Calendar Integration', description: 'Sync appointments with external calendars (Google, Apple, Outlook).', notes: 'Calendar events include appointment details and join links.', timeEstimate: '2 minutes' },
      { step: 3, title: 'Reminder Scheduling', description: 'System schedules reminders based on appointment time and patient preferences.', notes: 'Handles timezone differences automatically.', timeEstimate: 'Automatic' },
      { step: 4, title: 'Content Personalization', description: 'Include appointment details, provider info, preparation instructions.', notes: 'Provider can add custom pre-appointment instructions.', timeEstimate: 'Automatic' },
      { step: 5, title: 'Delivery Execution', description: 'Send reminder via configured channels at scheduled time.', notes: 'Retry failed deliveries. Log delivery status.', timeEstimate: 'Automatic' },
      { step: 6, title: 'Confirmation Tracking', description: 'Track whether patient opened/acknowledged reminder.', notes: 'Follow up if no acknowledgment 4 hours before appointment.', timeEstimate: 'Ongoing' },
      { step: 7, title: 'No-Show Prevention', description: 'Send final reminder 1 hour before. Offer easy reschedule option if needed.', notes: 'Reduces no-show rate by up to 50%.', timeEstimate: 'Automatic' }
    ],
    qualityChecks: [
      'Reminders sent at configured times',
      'Delivery rate above 98%',
      'Calendar sync functional for major providers',
      'Preparation instructions included when applicable',
      'No-show rate tracked and trending downward',
      'Patient can easily modify preferences'
    ],
    relatedSOPs: ['SOP-PAT-001 Booking', 'SOP-PAT-003 Cancellation']
  }
];

// ===========================================
// VIDEO TUTORIALS
// ===========================================

export const videos: Video[] = [
  {
    id: 1,
    title: 'Welcome to MDBaise: Complete Platform Overview',
    description: 'A comprehensive introduction to all the features and capabilities of the MDBaise platform. Perfect for new users who want to understand everything available.',
    category: 'quickstart',
    duration: '12:30',
    views: 45200,
    likes: 3890,
    featured: true,
    chapters: [
      { time: '0:00', title: 'Introduction' },
      { time: '1:30', title: 'Creating Your Account' },
      { time: '3:45', title: 'Finding Doctors' },
      { time: '6:00', title: 'Booking Appointments' },
      { time: '8:30', title: 'Teleconsultations' },
      { time: '10:45', title: 'Managing Your Dashboard' }
    ]
  },
  {
    id: 2,
    title: 'Finding the Perfect Doctor for Your Needs',
    description: 'Learn how to use search filters, compare providers, read reviews, and make informed decisions about your healthcare.',
    category: 'quickstart',
    duration: '7:15',
    views: 28900,
    likes: 2154,
    chapters: [
      { time: '0:00', title: 'Search Basics' },
      { time: '2:00', title: 'Using Filters' },
      { time: '4:00', title: 'Reading Reviews' },
      { time: '5:30', title: 'Comparing Providers' }
    ]
  },
  {
    id: 3,
    title: 'Your First Teleconsultation: Step-by-Step',
    description: 'Everything you need to know before, during, and after your video consultation. Technical setup, best practices, and troubleshooting.',
    category: 'quickstart',
    duration: '9:45',
    views: 35600,
    likes: 2821,
    chapters: [
      { time: '0:00', title: 'Preparation' },
      { time: '3:00', title: 'Technical Setup' },
      { time: '5:30', title: 'During the Call' },
      { time: '7:45', title: 'After Your Consultation' }
    ]
  },
  {
    id: 4,
    title: 'Provider Dashboard Masterclass',
    description: 'For healthcare providers: maximize your presence, manage your practice efficiently, and grow your patient base on MDBaise.',
    category: 'features',
    duration: '18:00',
    views: 15200,
    likes: 1412,
    featured: true,
    chapters: [
      { time: '0:00', title: 'Dashboard Overview' },
      { time: '3:00', title: 'Managing Appointments' },
      { time: '6:30', title: 'Analytics & Insights' },
      { time: '10:00', title: 'Patient Communication' },
      { time: '13:30', title: 'Payouts & Finances' },
      { time: '16:00', title: 'Growth Tips' }
    ]
  },
  {
    id: 5,
    title: 'Advanced Search & Filter Techniques',
    description: 'Discover hidden search features and advanced filters to find exactly the right healthcare provider for your specific needs.',
    category: 'features',
    duration: '6:30',
    views: 12800,
    likes: 987,
    chapters: [
      { time: '0:00', title: 'Advanced Filters' },
      { time: '2:30', title: 'Saving Searches' },
      { time: '4:00', title: 'Map View Tips' },
      { time: '5:30', title: 'Pro Search Tips' }
    ]
  },
  {
    id: 6,
    title: 'Managing Your Medical History on MDBaise',
    description: 'Keep track of appointments, prescriptions, test results, and health records all in one secure place.',
    category: 'features',
    duration: '8:00',
    views: 18100,
    likes: 1298,
    chapters: [
      { time: '0:00', title: 'Your Health Dashboard' },
      { time: '2:00', title: 'Appointment History' },
      { time: '4:00', title: 'Documents & Records' },
      { time: '6:00', title: 'Sharing with Providers' }
    ]
  },
  {
    id: 7,
    title: '5 Tips for Better Teleconsultations',
    description: 'Quick, actionable tips to get the most out of your virtual doctor visits. Improve communication and outcomes.',
    category: 'tips',
    duration: '4:30',
    views: 42700,
    likes: 3534,
    chapters: [
      { time: '0:00', title: 'Tip 1: Preparation' },
      { time: '1:00', title: 'Tip 2: Environment' },
      { time: '1:45', title: 'Tip 3: Communication' },
      { time: '2:30', title: 'Tip 4: Documentation' },
      { time: '3:30', title: 'Tip 5: Follow-up' }
    ]
  },
  {
    id: 8,
    title: 'Provider Success: Growing Your Patient Base',
    description: 'Proven strategies for healthcare providers to grow their practice and attract more patients on MDBaise.',
    category: 'tips',
    duration: '11:00',
    views: 9500,
    likes: 878,
    chapters: [
      { time: '0:00', title: 'Profile Optimization' },
      { time: '3:00', title: 'Pricing Strategy' },
      { time: '5:30', title: 'Review Management' },
      { time: '8:00', title: 'Social Content' }
    ]
  },
  {
    id: 9,
    title: 'Using the Social Feed Effectively',
    description: 'For providers: Learn to create engaging content, build your following, and connect with potential patients through the social feed.',
    category: 'features',
    duration: '10:30',
    views: 7800,
    likes: 645,
    chapters: [
      { time: '0:00', title: 'Feed Overview' },
      { time: '2:30', title: 'Creating Posts' },
      { time: '5:00', title: 'Going Live' },
      { time: '8:00', title: 'Engagement Tips' }
    ]
  },
  {
    id: 10,
    title: 'Payment & Insurance Guide',
    description: 'Everything you need to know about payments, insurance acceptance, receipts, and refunds on MDBaise.',
    category: 'features',
    duration: '7:45',
    views: 21300,
    likes: 1567,
    chapters: [
      { time: '0:00', title: 'Payment Methods' },
      { time: '2:00', title: 'Using Insurance' },
      { time: '4:00', title: 'Receipts & Invoices' },
      { time: '5:30', title: 'Refund Process' }
    ]
  },
  {
    id: 11,
    title: 'Mobile App Features & Navigation',
    description: 'Get the most out of the MDBaise mobile experience. App-specific features, notifications, and on-the-go booking.',
    category: 'quickstart',
    duration: '6:00',
    views: 16400,
    likes: 1203,
    chapters: [
      { time: '0:00', title: 'App Download' },
      { time: '1:00', title: 'Navigation' },
      { time: '3:00', title: 'Mobile Booking' },
      { time: '4:30', title: 'Notifications' }
    ]
  },
  {
    id: 12,
    title: 'December 2024 Feature Update',
    description: 'All the new features and improvements released this month. Live Q&A with the product team.',
    category: 'webinars',
    duration: '32:00',
    views: 5100,
    likes: 456,
    isNew: true,
    chapters: [
      { time: '0:00', title: 'Introduction' },
      { time: '3:00', title: 'New Features Demo' },
      { time: '15:00', title: 'Improvements' },
      { time: '22:00', title: 'Q&A Session' }
    ]
  },
  {
    id: 13,
    title: 'Ask the Experts: Healthcare Q&A Live',
    description: 'Recorded live Q&A session with top-rated providers discussing common health questions and platform tips.',
    category: 'webinars',
    duration: '48:00',
    views: 8200,
    likes: 745,
    chapters: [
      { time: '0:00', title: 'Introductions' },
      { time: '5:00', title: 'General Health Q&A' },
      { time: '20:00', title: 'Platform Tips' },
      { time: '35:00', title: 'Audience Questions' }
    ]
  },
  {
    id: 14,
    title: 'Setting Up Provider Verification',
    description: 'Complete guide for new providers on submitting credentials and completing the verification process.',
    category: 'quickstart',
    duration: '8:15',
    views: 6700,
    likes: 523,
    chapters: [
      { time: '0:00', title: 'Required Documents' },
      { time: '2:30', title: 'Upload Process' },
      { time: '5:00', title: 'Verification Timeline' },
      { time: '7:00', title: 'Common Issues' }
    ]
  },
  {
    id: 15,
    title: 'Booking for Family Members',
    description: 'How to book appointments for children, elderly parents, or other family members under your care.',
    category: 'tips',
    duration: '5:15',
    views: 11200,
    likes: 867,
    chapters: [
      { time: '0:00', title: 'Adding Family Members' },
      { time: '2:00', title: 'Booking Process' },
      { time: '3:30', title: 'Managing Appointments' }
    ]
  },
  // NEW: HIPAA & Security Videos
  {
    id: 16,
    title: 'Understanding HIPAA: Your Data Privacy Rights',
    description: 'Learn how MDBaise protects your medical information with HIPAA-compliant security measures.',
    category: 'features',
    duration: '8:30',
    views: 8900,
    likes: 712,
    isNew: true,
    chapters: [
      { time: '0:00', title: 'What is HIPAA?' },
      { time: '2:30', title: 'How We Protect Your Data' },
      { time: '5:00', title: 'Your Privacy Rights' },
      { time: '7:00', title: 'Managing Consent Forms' }
    ]
  },
  {
    id: 17,
    title: 'Managing Your Prescriptions',
    description: 'View prescriptions, request refills, and send e-prescriptions to your pharmacy.',
    category: 'features',
    duration: '6:45',
    views: 12300,
    likes: 945,
    isNew: true,
    chapters: [
      { time: '0:00', title: 'Viewing Prescriptions' },
      { time: '2:00', title: 'Requesting Refills' },
      { time: '4:00', title: 'Sending to Pharmacy' }
    ]
  },
  {
    id: 18,
    title: 'Uploading and Sharing Medical Records',
    description: 'Securely store lab results, imaging, and health documents in your personal health record.',
    category: 'features',
    duration: '7:20',
    views: 9800,
    likes: 823,
    isNew: true,
    chapters: [
      { time: '0:00', title: 'Uploading Documents' },
      { time: '2:30', title: 'Organizing Records' },
      { time: '4:30', title: 'Sharing with Providers' },
      { time: '6:00', title: 'Downloading Your Records' }
    ]
  },
  {
    id: 19,
    title: 'Insurance Verification Made Easy',
    description: 'Add your insurance, check eligibility, and see coverage before booking.',
    category: 'features',
    duration: '5:50',
    views: 7600,
    likes: 589,
    isNew: true,
    chapters: [
      { time: '0:00', title: 'Adding Insurance' },
      { time: '2:00', title: 'Eligibility Checks' },
      { time: '4:00', title: 'Understanding Coverage' }
    ]
  },
  {
    id: 20,
    title: 'Setting Up Appointment Reminders',
    description: 'Configure SMS, email, and calendar reminders so you never miss an appointment.',
    category: 'tips',
    duration: '4:30',
    views: 14200,
    likes: 1120,
    isNew: true,
    chapters: [
      { time: '0:00', title: 'Reminder Options' },
      { time: '1:30', title: 'Calendar Sync' },
      { time: '3:00', title: 'Custom Timing' }
    ]
  }
];

// Export category filters
export const faqCategories = [
  { id: 'all', label: 'All FAQs' },
  { id: 'account', label: 'Account' },
  { id: 'booking', label: 'Booking' },
  { id: 'payments', label: 'Payments' },
  { id: 'teleconsultation', label: 'Teleconsultation' },
  { id: 'providers', label: 'For Providers' },
  { id: 'features', label: 'Features' },
  { id: 'support', label: 'Support' },
  { id: 'security', label: 'Security & HIPAA' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'records', label: 'Medical Records' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'reminders', label: 'Reminders' }
];

export const tutorialCategories = [
  { id: 'all', label: 'All Tutorials' },
  { id: 'patients', label: 'For Patients' },
  { id: 'providers', label: 'For Providers' }
];

export const sopCategories = [
  { id: 'all', label: 'All SOPs' },
  { id: 'patient', label: 'Patient Procedures' },
  { id: 'provider', label: 'Provider Procedures' },
  { id: 'admin', label: 'Administrative' },
  { id: 'emergency', label: 'Emergency' }
];

export const videoCategories = [
  { id: 'all', label: 'All Videos' },
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'features', label: 'Feature Guides' },
  { id: 'tips', label: 'Tips & Tricks' },
  { id: 'webinars', label: 'Webinars' }
];
