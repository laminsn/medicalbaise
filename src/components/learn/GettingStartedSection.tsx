import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, Search, Calendar, MessageSquare, Star, CreditCard, 
  Video, Shield, ArrowRight, Clock, CheckCircle2 
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
    steps: 5,
    category: 'Account',
    difficulty: 'Beginner',
  },
  {
    id: 2,
    title: 'Find a Doctor',
    description: 'Search for healthcare professionals by specialty, location, or name',
    icon: Search,
    duration: '2 min',
    steps: 4,
    category: 'Search',
    difficulty: 'Beginner',
  },
  {
    id: 3,
    title: 'Book an Appointment',
    description: 'Schedule in-person or teleconsultation appointments',
    icon: Calendar,
    duration: '4 min',
    steps: 6,
    category: 'Booking',
    difficulty: 'Beginner',
  },
  {
    id: 4,
    title: 'Message Your Provider',
    description: 'Start secure conversations with healthcare professionals',
    icon: MessageSquare,
    duration: '2 min',
    steps: 3,
    category: 'Communication',
    difficulty: 'Beginner',
  },
  {
    id: 5,
    title: 'Leave a Review',
    description: 'Share your experience and help others find great doctors',
    icon: Star,
    duration: '2 min',
    steps: 4,
    category: 'Reviews',
    difficulty: 'Beginner',
  },
  {
    id: 6,
    title: 'Manage Payments',
    description: 'Add payment methods and view your transaction history',
    icon: CreditCard,
    duration: '3 min',
    steps: 5,
    category: 'Payments',
    difficulty: 'Beginner',
  },
  {
    id: 7,
    title: 'Join a Teleconsultation',
    description: 'Connect with your doctor via secure video call',
    icon: Video,
    duration: '3 min',
    steps: 4,
    category: 'Teleconsultation',
    difficulty: 'Beginner',
  },
  {
    id: 8,
    title: 'Verify Your Profile',
    description: 'Complete verification steps to unlock all platform features',
    icon: Shield,
    duration: '5 min',
    steps: 6,
    category: 'Verification',
    difficulty: 'Beginner',
  },
];

export function GettingStartedSection({ searchQuery }: GettingStartedSectionProps) {
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to MDBaise!</h2>
            <p className="text-muted-foreground mb-4">
              Follow these quick guides to get the most out of the platform. Whether you're a patient looking for care or a provider building your practice, we've got you covered.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-cyan-400">
                <Clock className="w-4 h-4" />
                <span>~25 min total</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>8 quick guides</span>
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
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                  <guide.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                    <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                      {guide.category}
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
                      <span>{guide.steps} steps</span>
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
          <p className="text-muted-foreground">No guides found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
