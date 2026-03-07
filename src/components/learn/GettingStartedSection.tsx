import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, Search, Calendar, MessageSquare, Star, CreditCard, 
  Video, Shield, ArrowRight, Clock, CheckCircle2, BookOpen
} from 'lucide-react';

interface GettingStartedSectionProps {
  searchQuery: string;
}

const gettingStartedGuides = [
  {
    id: 1,
    title: 'Create Your Account',
    description: 'Set up your MDBaise account as a patient or healthcare provider',
    icon: UserPlus,
    duration: '3 min',
    category: 'Account',
    difficulty: 'Beginner',
    steps: [
      { title: 'Go to Sign Up', content: 'Click the "Join" or "Sign Up" button in the top navigation bar to begin registration.' },
      { title: 'Choose Account Type', content: 'Select whether you\'re joining as a Patient seeking care or as a Healthcare Provider offering services.' },
      { title: 'Enter Your Information', content: 'Fill in your email address, create a secure password, and provide your full name.' },
      { title: 'Verify Your Email', content: 'Check your inbox for a verification email and click the confirmation link to activate your account.' },
      { title: 'Complete Your Profile', content: 'Add a profile photo, contact information, and any additional details to personalize your account.' },
    ],
  },
  {
    id: 2,
    title: 'Find a Doctor',
    description: 'Search for healthcare professionals by specialty, location, or name',
    icon: Search,
    duration: '2 min',
    category: 'Search',
    difficulty: 'Beginner',
    steps: [
      { title: 'Use the Search Bar', content: 'Enter a specialty (e.g., "Cardiologist"), condition, or doctor\'s name in the main search bar.' },
      { title: 'Apply Location Filters', content: 'Set your location to find doctors near you. You can search by city, neighborhood, or use your current location.' },
      { title: 'Browse Results', content: 'Review the list of matching healthcare providers with their ratings, specialties, and availability.' },
      { title: 'View Provider Profiles', content: 'Click on any provider card to see their full profile, credentials, reviews, and available appointment times.' },
    ],
  },
  {
    id: 3,
    title: 'Book an Appointment',
    description: 'Schedule in-person or teleconsultation appointments',
    icon: Calendar,
    duration: '4 min',
    category: 'Booking',
    difficulty: 'Beginner',
    steps: [
      { title: 'Select a Provider', content: 'Choose a healthcare provider from search results or your favorites list.' },
      { title: 'Choose Appointment Type', content: 'Select between in-person visit at the provider\'s clinic or a teleconsultation via video call.' },
      { title: 'Pick a Date', content: 'View the provider\'s availability calendar and select a date that works for you.' },
      { title: 'Select Time Slot', content: 'Choose from available time slots shown in green. Gray slots are already booked.' },
      { title: 'Add Details', content: 'Optionally add notes about your symptoms or reason for the visit to help the provider prepare.' },
      { title: 'Confirm & Pay', content: 'Review your booking details, apply any insurance or credits, and complete payment to confirm.' },
    ],
  },
  {
    id: 4,
    title: 'Message Your Provider',
    description: 'Start secure conversations with healthcare professionals',
    icon: MessageSquare,
    duration: '2 min',
    category: 'Communication',
    difficulty: 'Beginner',
    steps: [
      { title: 'Navigate to Messages', content: 'Click on "Messages" in the navigation menu or the message icon in the header.' },
      { title: 'Start a New Chat', content: 'Click "New Message" and search for your provider, or continue an existing conversation from your list.' },
      { title: 'Send Your Message', content: 'Type your message and click send. You can also attach images or documents if needed.' },
    ],
  },
  {
    id: 5,
    title: 'Leave a Review',
    description: 'Share your experience and help others find great doctors',
    icon: Star,
    duration: '2 min',
    category: 'Reviews',
    difficulty: 'Beginner',
    steps: [
      { title: 'Go to Past Appointments', content: 'Navigate to your Profile and find the completed appointment you want to review.' },
      { title: 'Click "Leave Review"', content: 'On the appointment card, click the "Leave Review" or star rating button.' },
      { title: 'Rate Your Experience', content: 'Provide star ratings for different aspects: quality of care, communication, punctuality, and overall experience.' },
      { title: 'Write Your Feedback', content: 'Add a written review describing your experience to help other patients make informed decisions.' },
    ],
  },
  {
    id: 6,
    title: 'Manage Payments',
    description: 'Add payment methods and view your transaction history',
    icon: CreditCard,
    duration: '3 min',
    category: 'Payments',
    difficulty: 'Beginner',
    steps: [
      { title: 'Access Payment Settings', content: 'Go to Settings > Payments to manage your payment methods and view history.' },
      { title: 'Add a Payment Method', content: 'Click "Add Payment Method" and enter your credit/debit card details or connect PIX.' },
      { title: 'Set Default Payment', content: 'Mark your preferred payment method as default for faster checkout.' },
      { title: 'View Transaction History', content: 'Review all past payments, receipts, and pending charges in the Transactions tab.' },
      { title: 'Download Receipts', content: 'Click on any transaction to view details and download a PDF receipt for your records.' },
    ],
  },
  {
    id: 7,
    title: 'Join a Teleconsultation',
    description: 'Connect with your doctor via secure video call',
    icon: Video,
    duration: '3 min',
    category: 'Teleconsultation',
    difficulty: 'Beginner',
    steps: [
      { title: 'Check Your Setup', content: 'Ensure your device has a working camera and microphone. Test your internet connection for stability.' },
      { title: 'Find Your Appointment', content: 'Go to your upcoming appointments and find the teleconsultation booking.' },
      { title: 'Join the Call', content: 'Click "Join Call" when it becomes available (usually 5-10 minutes before the scheduled time).' },
      { title: 'Allow Permissions', content: 'When prompted by your browser, allow access to your camera and microphone to enable video calling.' },
    ],
  },
  {
    id: 8,
    title: 'Verify Your Profile',
    description: 'Complete verification steps to unlock all platform features',
    icon: Shield,
    duration: '5 min',
    category: 'Verification',
    difficulty: 'Beginner',
    steps: [
      { title: 'Go to Verification', content: 'Navigate to Settings > Account > Verification to start the verification process.' },
      { title: 'Verify Email', content: 'Confirm your email address if you haven\'t already by clicking the link sent to your inbox.' },
      { title: 'Verify Phone Number', content: 'Enter your phone number and confirm with the SMS code we send you.' },
      { title: 'Upload ID Document', content: 'For providers: Upload a clear photo of your professional credentials (CRM certificate, etc.).' },
      { title: 'Add Profile Photo', content: 'Upload a clear, professional photo of yourself for your public profile.' },
      { title: 'Wait for Review', content: 'Our team will review your documents within 24-48 hours. You\'ll receive a notification once verified.' },
    ],
  },
];

export function GettingStartedSection({ searchQuery }: GettingStartedSectionProps) {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const [selectedGuide, setSelectedGuide] = useState<typeof gettingStartedGuides[0] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const categoryLabels: Record<string, { en: string; pt: string }> = {
    Account: { en: 'Account', pt: 'Conta' },
    Search: { en: 'Search', pt: 'Busca' },
    Booking: { en: 'Booking', pt: 'Agendamento' },
    Communication: { en: 'Communication', pt: 'Comunicação' },
    Reviews: { en: 'Reviews', pt: 'Avaliações' },
    Payments: { en: 'Payments', pt: 'Pagamentos' },
    Teleconsultation: { en: 'Teleconsultation', pt: 'Teleconsulta' },
    Verification: { en: 'Verification', pt: 'Verificação' },
    Providers: { en: 'Providers', pt: 'Profissionais' },
    Settings: { en: 'Settings', pt: 'Configurações' },
    Security: { en: 'Security', pt: 'Segurança' },
    Compliance: { en: 'Compliance', pt: 'Conformidade' },
  };

  const difficultyLabels: Record<string, { en: string; pt: string }> = {
    Beginner: { en: 'Beginner', pt: 'Iniciante' },
    Intermediate: { en: 'Intermediate', pt: 'Intermediário' },
    Advanced: { en: 'Advanced', pt: 'Avançado' },
  };

  const filteredGuides = gettingStartedGuides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isPt ? 'Bem-vindo ao MDBaise!' : 'Welcome to MDBaise!'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPt
                ? 'Siga estes guias rápidos para aproveitar ao máximo a plataforma. Seja você um paciente em busca de atendimento ou um profissional desenvolvendo sua prática, estamos com você.'
                : "Follow these quick guides to get the most out of the platform. Whether you're a patient looking for care or a provider building your practice, we've got you covered."}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-cyan-400">
                <Clock className="w-4 h-4" />
                <span>{isPt ? '~25 min no total' : '~25 min total'}</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isPt ? '8 guias rápidos' : '8 quick guides'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredGuides.map((guide, index) => (
          <Card 
            key={guide.id} 
            className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-all cursor-pointer group"
            onClick={() => {
              setSelectedGuide(guide);
              setCurrentStep(0);
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                  <guide.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{isPt ? 'Etapa' : 'Step'} {index + 1}</span>
                    <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                      {isPt ? (categoryLabels[guide.category]?.pt ?? guide.category) : (categoryLabels[guide.category]?.en ?? guide.category)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-cyan-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {guide.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {guide.duration}
                      </span>
                      <span>{guide.steps.length} {isPt ? 'etapas' : 'steps'}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isPt
              ? `Nenhum guia encontrado para "${searchQuery}"`
              : `No guides found matching "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Guide Detail Dialog */}
      <Dialog open={!!selectedGuide} onOpenChange={() => setSelectedGuide(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border">
          {selectedGuide && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                    {isPt
                      ? (difficultyLabels[selectedGuide.difficulty]?.pt ?? selectedGuide.difficulty)
                      : (difficultyLabels[selectedGuide.difficulty]?.en ?? selectedGuide.difficulty)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {isPt ? (categoryLabels[selectedGuide.category]?.pt ?? selectedGuide.category) : (categoryLabels[selectedGuide.category]?.en ?? selectedGuide.category)}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedGuide.title}</DialogTitle>
                <p className="text-muted-foreground">{selectedGuide.description}</p>
              </DialogHeader>

              <div className="mt-6">
                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-6">
                  {selectedGuide.steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        index <= currentStep ? 'bg-cyan-500' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                {/* Step Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                      {currentStep + 1}
                    </div>
                    <h3 className="text-lg font-semibold">
                      {selectedGuide.steps[currentStep].title}
                    </h3>
                  </div>

                  <p className="text-muted-foreground">
                    {selectedGuide.steps[currentStep].content}
                  </p>

                  {/* Screenshot Placeholder */}
                  <div className="bg-muted/30 border border-border/50 rounded-xl aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{isPt ? 'Espaço para captura de tela' : 'Screenshot placeholder'}</p>
                      <p className="text-xs text-muted-foreground">{isPt ? 'Guia visual em breve' : 'Visual guide coming soon'}</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      disabled={currentStep === 0}
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="border-border/50"
                    >
                      {isPt ? 'Anterior' : 'Previous'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {isPt ? 'Etapa' : 'Step'} {currentStep + 1} {isPt ? 'de' : 'of'} {selectedGuide.steps.length}
                    </span>
                    <Button
                      disabled={currentStep === selectedGuide.steps.length - 1}
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                      {isPt ? 'Próxima' : 'Next'}
                    </Button>
                  </div>
                </div>

                {/* Step List */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <h4 className="font-medium mb-4">{isPt ? 'Todas as etapas' : 'All Steps'}</h4>
                  <div className="space-y-2">
                    {selectedGuide.steps.map((step, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                          index === currentStep
                            ? 'bg-cyan-500/20 border border-cyan-500/30'
                            : index < currentStep
                            ? 'bg-muted/30 hover:bg-muted/50'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            index <= currentStep
                              ? 'bg-cyan-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                        </div>
                        <span
                          className={`text-sm ${
                            index === currentStep
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {step.title}
                        </span>
                      </button>
                    ))}
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
