import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, Clock, ChevronRight, CheckCircle2, Circle, 
  User, Calendar, Search, MessageSquare, Star, Video, 
  Settings, CreditCard, Shield, FileText
} from 'lucide-react';

interface TutorialsSectionProps {
  searchQuery: string;
}

const tutorialCategories = [
  { id: 'all', label: 'All Tutorials' },
  { id: 'patients', label: 'For Patients' },
  { id: 'providers', label: 'For Providers' },
  { id: 'advanced', label: 'Advanced' },
];

const tutorials = [
  {
    id: 1,
    title: 'Complete Guide to Booking Your First Appointment',
    description: 'Learn how to search for doctors, compare profiles, and book your first appointment on MDBaise.',
    category: 'patients',
    difficulty: 'Beginner',
    duration: '5 min read',
    icon: Calendar,
    steps: [
      {
        title: 'Navigate to Find Doctors',
        content: 'Click on "Find Doctors" in the navigation menu or use the search bar on the homepage.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Search by Specialty or Name',
        content: 'Enter the specialty you need (e.g., "Cardiology") or a specific doctor\'s name in the search field.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Apply Filters',
        content: 'Use filters to narrow down results by location, availability, ratings, and whether they accept your insurance.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Review Doctor Profiles',
        content: 'Click on a doctor\'s card to view their full profile, including qualifications, reviews, and available services.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Select Appointment Type',
        content: 'Choose between in-person consultation or teleconsultation based on your needs and the doctor\'s availability.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Pick Date and Time',
        content: 'Select your preferred date and time slot from the doctor\'s calendar. Available slots are shown in green.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Confirm and Pay',
        content: 'Review your booking details, add any notes for the doctor, and complete payment to confirm your appointment.',
        screenshot: '/placeholder.svg',
      },
    ],
  },
  {
    id: 2,
    title: 'Setting Up Your Provider Profile',
    description: 'A complete walkthrough for healthcare providers to create a professional profile that attracts patients.',
    category: 'providers',
    difficulty: 'Beginner',
    duration: '8 min read',
    icon: User,
    steps: [
      {
        title: 'Register as a Provider',
        content: 'Click "Join" and select "Healthcare Provider" to begin the registration process.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Enter Basic Information',
        content: 'Fill in your name, contact details, and primary specialty. This information will be displayed on your public profile.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Add Your Credentials',
        content: 'Enter your CRM number, medical school, graduation year, and any specialty certifications you hold.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Upload Verification Documents',
        content: 'Upload clear photos of your CRM certificate, diploma, and other credentials for verification.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Write Your Bio',
        content: 'Create a compelling bio that highlights your experience, approach to patient care, and areas of expertise.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Set Your Services and Pricing',
        content: 'Add the services you offer, set pricing for consultations, and specify if you accept insurance plans.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Configure Availability',
        content: 'Set your working hours, appointment duration, and blackout dates. Enable or disable teleconsultation.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Publish Your Profile',
        content: 'Review your profile preview and click "Publish" to make your profile visible to potential patients.',
        screenshot: '/placeholder.svg',
      },
    ],
  },
  {
    id: 3,
    title: 'Mastering Teleconsultation',
    description: 'Everything you need to know about conducting and joining video consultations on MDBaise.',
    category: 'patients',
    difficulty: 'Intermediate',
    duration: '6 min read',
    icon: Video,
    steps: [
      {
        title: 'Check Your Equipment',
        content: 'Ensure you have a device with a working camera and microphone. Test your internet connection for stability.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Join 5 Minutes Early',
        content: 'Click the "Join Call" button in your appointment details 5 minutes before the scheduled time.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Allow Browser Permissions',
        content: 'When prompted, allow your browser to access your camera and microphone. This is required for the video call.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Test Audio and Video',
        content: 'Use the preview screen to check your video and audio. Adjust settings if needed before entering the call.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'During the Consultation',
        content: 'Speak clearly, ensure good lighting on your face, and minimize background noise for the best experience.',
        screenshot: '/placeholder.svg',
      },
    ],
  },
  {
    id: 4,
    title: 'Managing Your Appointments Dashboard',
    description: 'Learn to efficiently manage all your appointments, reschedule, and track your medical history.',
    category: 'patients',
    difficulty: 'Beginner',
    duration: '4 min read',
    icon: Calendar,
    steps: [
      {
        title: 'Access Your Dashboard',
        content: 'Click on "Profile" in the navigation to access your personal dashboard and appointment management.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'View Upcoming Appointments',
        content: 'Your upcoming appointments are displayed at the top with date, time, and provider information.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Reschedule an Appointment',
        content: 'Click the three dots menu on any appointment and select "Reschedule" to choose a new time slot.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Cancel an Appointment',
        content: 'Select "Cancel" from the menu. Be aware of the provider\'s cancellation policy regarding refunds.',
        screenshot: '/placeholder.svg',
      },
    ],
  },
  {
    id: 5,
    title: 'Responding to Quote Requests',
    description: 'For providers: Learn how to effectively respond to patient quote requests and win new patients.',
    category: 'providers',
    difficulty: 'Intermediate',
    duration: '5 min read',
    icon: FileText,
    steps: [
      {
        title: 'Check New Quote Requests',
        content: 'Navigate to your Provider Dashboard and click on "Quote Requests" to see pending patient inquiries.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Review Patient Details',
        content: 'Read the patient\'s description of their needs, preferred timing, and any specific requirements.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Prepare Your Response',
        content: 'Consider the service needed, your availability, and competitive pricing before crafting your response.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Submit Your Quote',
        content: 'Enter your proposed price, estimated timeline, and a personalized message explaining your approach.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Follow Up',
        content: 'If the patient has questions, respond promptly through the messaging system to increase conversion.',
        screenshot: '/placeholder.svg',
      },
    ],
  },
  {
    id: 6,
    title: 'Building Your Provider Reputation',
    description: 'Strategies for earning positive reviews and building a strong professional presence on MDBaise.',
    category: 'providers',
    difficulty: 'Advanced',
    duration: '7 min read',
    icon: Star,
    steps: [
      {
        title: 'Complete Your Profile 100%',
        content: 'Profiles with photos, detailed bios, and complete credentials receive 3x more patient inquiries.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Respond Quickly to Messages',
        content: 'Providers who respond within 2 hours have a 40% higher booking rate. Enable notifications to stay on top.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Request Reviews After Appointments',
        content: 'After successful consultations, send a friendly reminder for patients to leave a review.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Respond to All Reviews',
        content: 'Thank patients for positive reviews and professionally address any concerns in negative ones.',
        screenshot: '/placeholder.svg',
      },
      {
        title: 'Share Your Expertise',
        content: 'Post educational content, go live with health tips, and engage with the MDBaise community.',
        screenshot: '/placeholder.svg',
      },
    ],
  },
];

export function TutorialsSection({ searchQuery }: TutorialsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTutorial, setSelectedTutorial] = useState<typeof tutorials[0] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {tutorialCategories.map((cat) => (
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
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Tutorials Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredTutorials.map((tutorial) => (
          <Card
            key={tutorial.id}
            className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-all cursor-pointer group"
            onClick={() => {
              setSelectedTutorial(tutorial);
              setCurrentStep(0);
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                  <tutorial.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                      {tutorial.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {tutorial.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tutorial.duration}
                      </span>
                      <span>{tutorial.steps.length} steps</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tutorials found matching your search</p>
        </div>
      )}

      {/* Tutorial Detail Dialog */}
      <Dialog open={!!selectedTutorial} onOpenChange={() => setSelectedTutorial(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          {selectedTutorial && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                    {selectedTutorial.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedTutorial.category}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedTutorial.title}</DialogTitle>
                <p className="text-muted-foreground">{selectedTutorial.description}</p>
              </DialogHeader>

              <div className="mt-6">
                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-6">
                  {selectedTutorial.steps.map((_, index) => (
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
                      {selectedTutorial.steps[currentStep].title}
                    </h3>
                  </div>

                  <p className="text-muted-foreground">
                    {selectedTutorial.steps[currentStep].content}
                  </p>

                  {/* Screenshot Placeholder */}
                  <div className="bg-muted/30 border border-border/50 rounded-xl aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Screenshot placeholder</p>
                      <p className="text-xs text-muted-foreground">Auto-generated with platform updates</p>
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
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Step {currentStep + 1} of {selectedTutorial.steps.length}
                    </span>
                    <Button
                      disabled={currentStep === selectedTutorial.steps.length - 1}
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Step List */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <h4 className="font-medium mb-4">All Steps</h4>
                  <div className="space-y-2">
                    {selectedTutorial.steps.map((step, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          index === currentStep
                            ? 'bg-cyan-500/10 border border-cyan-500/30'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        ) : index === currentStep ? (
                          <div className="w-5 h-5 rounded-full border-2 border-cyan-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-cyan-500" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className={index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
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
