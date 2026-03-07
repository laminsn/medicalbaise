import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Download, Printer, Clock, CheckSquare, AlertTriangle, 
  Users, Calendar, CreditCard, Video, MessageSquare, Shield, Settings,
  ChevronRight, CheckCircle2
} from 'lucide-react';

interface SOPSectionProps {
  searchQuery: string;
}

const sopCategories = [
  { id: 'all', label: 'All SOPs' },
  { id: 'patient', label: 'Patient Procedures' },
  { id: 'provider', label: 'Provider Procedures' },
  { id: 'admin', label: 'Administrative' },
  { id: 'emergency', label: 'Emergency' },
];

const sops = [
  {
    id: 1,
    title: 'Patient Appointment Booking SOP',
    code: 'SOP-PAT-001',
    version: '2.1',
    lastUpdated: '2024-12-01',
    category: 'patient',
    department: 'Patient Services',
    icon: Calendar,
    overview: 'Standard procedure for patients to book appointments with healthcare providers on the MDBaise platform.',
    scope: 'All registered patients seeking medical consultations.',
    responsibilities: [
      'Patient: Provide accurate information and arrive on time',
      'System: Display available slots and confirm bookings',
      'Provider: Maintain updated availability calendar',
    ],
    steps: [
      {
        step: 1,
        title: 'Access the Platform',
        description: 'Log into your MDBaise account using registered credentials.',
        notes: 'If you don\'t have an account, complete registration first (see SOP-PAT-000).',
      },
      {
        step: 2,
        title: 'Search for Provider',
        description: 'Use the search function to find a healthcare provider by specialty, name, or location.',
        notes: 'Filters can be applied to narrow down results based on availability, ratings, and insurance acceptance.',
      },
      {
        step: 3,
        title: 'Review Provider Profile',
        description: 'Examine the provider\'s qualifications, reviews, services offered, and pricing.',
        notes: 'Verified providers display a blue checkmark badge.',
      },
      {
        step: 4,
        title: 'Select Appointment Type',
        description: 'Choose between in-person consultation or teleconsultation based on availability.',
        notes: 'Some providers may only offer one type of consultation.',
      },
      {
        step: 5,
        title: 'Pick Date and Time',
        description: 'Select an available slot from the provider\'s calendar.',
        notes: 'Green slots indicate availability. Gray slots are already booked.',
      },
      {
        step: 6,
        title: 'Provide Appointment Details',
        description: 'Enter reason for visit and any relevant medical information.',
        notes: 'This information helps the provider prepare for your consultation.',
      },
      {
        step: 7,
        title: 'Confirm Payment',
        description: 'Review the total cost and complete payment using your preferred method.',
        notes: 'Payment is authorized but typically charged after consultation completion.',
      },
      {
        step: 8,
        title: 'Receive Confirmation',
        description: 'Verify booking confirmation via email and in-app notification.',
        notes: 'Save the confirmation details and add the appointment to your calendar.',
      },
    ],
    qualityChecks: [
      'Confirmation email received within 5 minutes',
      'Appointment visible in "My Appointments" section',
      'Calendar reminder set for 24 hours before',
    ],
  },
  {
    id: 2,
    title: 'Teleconsultation Execution SOP',
    code: 'SOP-PAT-002',
    version: '1.8',
    lastUpdated: '2024-11-15',
    category: 'patient',
    department: 'Patient Services',
    icon: Video,
    overview: 'Standard procedure for patients to join and participate in video consultations.',
    scope: 'All patients with scheduled teleconsultation appointments.',
    responsibilities: [
      'Patient: Ensure proper equipment and join on time',
      'Provider: Maintain professional environment and arrive on time',
      'System: Provide stable, encrypted video connection',
    ],
    steps: [
      {
        step: 1,
        title: 'Pre-Consultation Preparation',
        description: 'Test your camera, microphone, and internet connection at least 15 minutes before.',
        notes: 'Use the system check tool available in your appointment details.',
      },
      {
        step: 2,
        title: 'Environment Setup',
        description: 'Find a quiet, well-lit, private space for your consultation.',
        notes: 'Avoid backlit positions and minimize background noise.',
      },
      {
        step: 3,
        title: 'Join the Waiting Room',
        description: 'Click "Join Call" 5 minutes before your scheduled time.',
        notes: 'You will enter a virtual waiting room until the provider admits you.',
      },
      {
        step: 4,
        title: 'Verify Permissions',
        description: 'Allow browser access to camera and microphone when prompted.',
        notes: 'If not prompted, check browser settings for blocked permissions.',
      },
      {
        step: 5,
        title: 'Conduct Consultation',
        description: 'Communicate clearly, share relevant symptoms and medical history.',
        notes: 'Have any relevant documents or previous test results ready to share.',
      },
      {
        step: 6,
        title: 'Post-Consultation Review',
        description: 'Review any prescriptions, recommendations, or follow-up instructions provided.',
        notes: 'These will be available in your appointment summary.',
      },
    ],
    qualityChecks: [
      'Video and audio quality sufficient for clear communication',
      'Consultation summary received within 1 hour',
      'All prescriptions accessible in patient portal',
    ],
  },
  {
    id: 3,
    title: 'Provider Profile Setup SOP',
    code: 'SOP-PRO-001',
    version: '3.0',
    lastUpdated: '2024-12-05',
    category: 'provider',
    department: 'Provider Operations',
    icon: Users,
    overview: 'Standard procedure for healthcare providers to create and optimize their professional profile.',
    scope: 'All new healthcare providers joining the MDBaise platform.',
    responsibilities: [
      'Provider: Submit accurate credentials and maintain profile',
      'Verification Team: Review and validate credentials within 5 business days',
      'System: Display verification status and manage profile visibility',
    ],
    steps: [
      {
        step: 1,
        title: 'Account Registration',
        description: 'Complete provider registration form with personal and professional details.',
        notes: 'Use your official registered name as it appears on medical credentials.',
      },
      {
        step: 2,
        title: 'Credential Submission',
        description: 'Upload CRM certificate, medical degree, and specialty certifications.',
        notes: 'Documents must be clear, legible, and show expiration dates where applicable.',
      },
      {
        step: 3,
        title: 'Profile Content Creation',
        description: 'Write professional bio, list specialties, and describe your approach to patient care.',
        notes: 'Profiles with complete bios receive 40% more patient inquiries.',
      },
      {
        step: 4,
        title: 'Service Configuration',
        description: 'Set up services offered, consultation types, and pricing structure.',
        notes: 'Consider competitive pricing research before setting your rates.',
      },
      {
        step: 5,
        title: 'Availability Setup',
        description: 'Configure working hours, appointment duration, and booking buffer time.',
        notes: 'Regular availability updates improve search ranking.',
      },
      {
        step: 6,
        title: 'Verification Completion',
        description: 'Wait for credential verification and address any requests for additional documentation.',
        notes: 'Verification typically completes within 2-5 business days.',
      },
      {
        step: 7,
        title: 'Profile Publication',
        description: 'Review profile preview and publish to make visible to patients.',
        notes: 'Profile can be unpublished at any time from settings.',
      },
    ],
    qualityChecks: [
      'All required fields completed (100% profile completion)',
      'Verification badge displayed on profile',
      'Profile appears in relevant search results',
    ],
  },
  {
    id: 4,
    title: 'Payment Processing SOP',
    code: 'SOP-FIN-001',
    version: '2.5',
    lastUpdated: '2024-11-20',
    category: 'admin',
    department: 'Finance',
    icon: CreditCard,
    overview: 'Standard procedure for processing payments, refunds, and provider payouts.',
    scope: 'All financial transactions on the MDBaise platform.',
    responsibilities: [
      'Patient: Maintain valid payment method on file',
      'Provider: Complete consultations to trigger payment release',
      'Finance Team: Process payouts within scheduled timeline',
    ],
    steps: [
      {
        step: 1,
        title: 'Payment Authorization',
        description: 'System authorizes payment amount when appointment is booked.',
        notes: 'Authorization holds expire after 7 days if appointment is cancelled.',
      },
      {
        step: 2,
        title: 'Service Delivery',
        description: 'Healthcare provider delivers the scheduled consultation.',
        notes: 'Both parties must mark the consultation as completed.',
      },
      {
        step: 3,
        title: 'Payment Capture',
        description: 'System captures authorized amount upon consultation completion.',
        notes: 'Capture occurs within 24 hours of service completion.',
      },
      {
        step: 4,
        title: 'Platform Fee Deduction',
        description: 'Applicable platform fees are calculated and deducted.',
        notes: 'Fee percentage varies by provider subscription tier.',
      },
      {
        step: 5,
        title: 'Provider Payout',
        description: 'Net amount is added to provider\'s payout balance.',
        notes: 'Payouts are processed weekly on Fridays.',
      },
    ],
    qualityChecks: [
      'Transaction recorded in both patient and provider accounts',
      'Receipt/invoice generated and accessible',
      'Payout reflected in provider balance within 48 hours',
    ],
  },
  {
    id: 5,
    title: 'Emergency Escalation SOP',
    code: 'SOP-EMG-001',
    version: '1.2',
    lastUpdated: '2024-10-30',
    category: 'emergency',
    department: 'Safety & Compliance',
    icon: AlertTriangle,
    overview: 'Standard procedure for handling medical emergencies reported through the platform.',
    scope: 'All emergency situations identified during patient-provider interactions.',
    responsibilities: [
      'Provider: Identify emergency signs and initiate protocol',
      'Patient/Caregiver: Follow emergency instructions',
      'Support Team: Coordinate with emergency services if needed',
    ],
    steps: [
      {
        step: 1,
        title: 'Emergency Identification',
        description: 'Recognize signs of medical emergency during consultation.',
        notes: 'Red flags include: chest pain, difficulty breathing, signs of stroke, severe bleeding.',
      },
      {
        step: 2,
        title: 'Immediate Response',
        description: 'Provider instructs patient to call emergency services immediately.',
        notes: 'Maintain video/audio connection while patient calls for help.',
      },
      {
        step: 3,
        title: 'Document Location',
        description: 'Confirm patient\'s current physical location for emergency responders.',
        notes: 'Request full address including apartment/building details.',
      },
      {
        step: 4,
        title: 'Stay Connected',
        description: 'Remain on call providing guidance until emergency services arrive.',
        notes: 'Document timeline and instructions given.',
      },
      {
        step: 5,
        title: 'Incident Report',
        description: 'Complete emergency incident report within 24 hours.',
        notes: 'Report submitted through Provider Dashboard > Incidents.',
      },
    ],
    qualityChecks: [
      'Emergency services contacted within 2 minutes of identification',
      'Patient location confirmed and documented',
      'Incident report filed within 24 hours',
    ],
  },
  {
    id: 6,
    title: 'Patient Data Security SOP',
    code: 'SOP-SEC-001',
    version: '2.0',
    lastUpdated: '2024-12-01',
    category: 'admin',
    department: 'Information Security',
    icon: Shield,
    overview: 'Standard procedure for protecting patient health information and ensuring LGPD/HIPAA compliance.',
    scope: 'All users and systems handling patient data.',
    responsibilities: [
      'All Users: Follow data handling protocols',
      'IT Team: Maintain security infrastructure',
      'Compliance: Conduct regular audits and training',
    ],
    steps: [
      {
        step: 1,
        title: 'Data Classification',
        description: 'Identify and classify patient data according to sensitivity levels.',
        notes: 'PHI (Protected Health Information) requires highest security controls.',
      },
      {
        step: 2,
        title: 'Access Control',
        description: 'Verify user has legitimate need and authorization to access data.',
        notes: 'Access is logged and auditable. Unauthorized access triggers alerts.',
      },
      {
        step: 3,
        title: 'Secure Transmission',
        description: 'Ensure all data transfers use encrypted channels (TLS 1.3+).',
        notes: 'Never transmit PHI via unencrypted email or messaging.',
      },
      {
        step: 4,
        title: 'Data Storage',
        description: 'Store patient data only in approved, encrypted systems.',
        notes: 'Local storage of patient data is prohibited.',
      },
      {
        step: 5,
        title: 'Incident Response',
        description: 'Report any suspected data breach immediately through security channel.',
        notes: 'Do not attempt to investigate independently.',
      },
    ],
    qualityChecks: [
      'All data transmissions encrypted',
      'Access logs reviewed weekly',
      'No unauthorized access attempts',
    ],
  },
];

export function SOPSection({ searchQuery }: SOPSectionProps) {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSOP, setSelectedSOP] = useState<typeof sops[0] | null>(null);

  const sopCategoryLabels: Record<string, { en: string; pt: string }> = {
    all: { en: 'All SOPs', pt: 'Todos os POPs' },
    patient: { en: 'Patient Procedures', pt: 'Procedimentos para pacientes' },
    provider: { en: 'Provider Procedures', pt: 'Procedimentos para profissionais' },
    admin: { en: 'Administrative', pt: 'Administrativo' },
    emergency: { en: 'Emergency', pt: 'Emergência' },
  };

  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch =
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.overview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">{isPt ? 'Procedimentos Operacionais Padrão' : 'Standard Operating Procedures'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPt
                ? 'Esses POPs são atualizados automaticamente a cada release da plataforma. Consulte sempre a versão mais recente.'
                : 'These SOPs are automatically updated with each platform release. Always refer to the latest version.'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {sopCategories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={
              selectedCategory === cat.id
                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                : 'border-border/50 hover:border-cyan-500/30 hover:text-cyan-400'
            }
          >
            {isPt ? (sopCategoryLabels[cat.id]?.pt ?? cat.label) : (sopCategoryLabels[cat.id]?.en ?? cat.label)}
          </Button>
        ))}
      </div>

      {/* SOP List */}
      <div className="space-y-4">
        {filteredSOPs.map((sop) => (
          <Card
            key={sop.id}
            className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-all cursor-pointer"
            onClick={() => setSelectedSOP(sop)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <sop.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono border-cyan-500/30 text-cyan-400">
                      {sop.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {isPt ? (sopCategoryLabels[sop.category]?.pt ?? sop.category) : (sopCategoryLabels[sop.category]?.en ?? sop.category)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{sop.version}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{sop.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{sop.overview}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isPt ? 'Atualizado' : 'Updated'} {sop.lastUpdated}
                    </span>
                    <span>{sop.steps.length} {isPt ? 'etapas' : 'steps'}</span>
                    <span>{sop.department}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSOPs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{isPt ? 'Nenhum POP encontrado para sua busca' : 'No SOPs found matching your search'}</p>
        </div>
      )}

      {/* SOP Detail Dialog */}
      <Dialog open={!!selectedSOP} onOpenChange={() => setSelectedSOP(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          {selectedSOP && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-mono border-cyan-500/30 text-cyan-400">
                    {selectedSOP.code}
                  </Badge>
                  <Badge variant="outline" className="text-xs">v{selectedSOP.version}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {isPt
                      ? (sopCategoryLabels[selectedSOP.category]?.pt ?? selectedSOP.category)
                      : (sopCategoryLabels[selectedSOP.category]?.en ?? selectedSOP.category)}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedSOP.title}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{isPt ? 'Departamento' : 'Department'}: {selectedSOP.department}</span>
                  <span>{isPt ? 'Última atualização' : 'Last Updated'}: {selectedSOP.lastUpdated}</span>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border/50">
                    <Download className="w-4 h-4 mr-2" />
                    {isPt ? 'Baixar PDF' : 'Download PDF'}
                  </Button>
                  <Button variant="outline" size="sm" className="border-border/50">
                    <Printer className="w-4 h-4 mr-2" />
                    {isPt ? 'Imprimir' : 'Print'}
                  </Button>
                </div>

                {/* Overview */}
                <div>
                  <h4 className="font-semibold mb-2">{isPt ? 'Visão geral' : 'Overview'}</h4>
                  <p className="text-muted-foreground">{selectedSOP.overview}</p>
                </div>

                {/* Scope */}
                <div>
                  <h4 className="font-semibold mb-2">{isPt ? 'Escopo' : 'Scope'}</h4>
                  <p className="text-muted-foreground">{selectedSOP.scope}</p>
                </div>

                {/* Responsibilities */}
                <div>
                  <h4 className="font-semibold mb-2">{isPt ? 'Responsabilidades' : 'Responsibilities'}</h4>
                  <ul className="space-y-2">
                    {selectedSOP.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <CheckSquare className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Procedure Steps */}
                <div>
                  <h4 className="font-semibold mb-4">{isPt ? 'Procedimento' : 'Procedure'}</h4>
                  <Accordion type="single" collapsible className="space-y-2">
                    {selectedSOP.steps.map((step) => (
                      <AccordionItem
                        key={step.step}
                        value={`step-${step.step}`}
                        className="bg-card/30 border border-border/50 rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-medium text-sm">
                              {step.step}
                            </div>
                            <span className="font-medium text-foreground">{step.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <div className="pl-11 space-y-3">
                            <p className="text-muted-foreground">{step.description}</p>
                            {step.notes && (
                              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                                <span className="text-cyan-400 font-medium">{isPt ? 'Nota: ' : 'Note: '}</span>
                                <span className="text-muted-foreground">{step.notes}</span>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                {/* Quality Checks */}
                <div>
                  <h4 className="font-semibold mb-2">{isPt ? 'Verificações de qualidade' : 'Quality Checks'}</h4>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <ul className="space-y-2">
                      {selectedSOP.qualityChecks.map((check, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
