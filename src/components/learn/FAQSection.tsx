import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, Calendar, CreditCard, Video, Shield, MessageSquare, 
  Star, Settings, Bell, HelpCircle 
} from 'lucide-react';

interface FAQSectionProps {
  searchQuery: string;
}

const faqCategories = [
  { id: 'all', label: 'All', icon: HelpCircle },
  { id: 'account', label: 'Account', icon: User },
  { id: 'booking', label: 'Booking', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'teleconsultation', label: 'Teleconsultation', icon: Video },
  { id: 'providers', label: 'For Providers', icon: Shield },
];

const faqs = [
  {
    id: 1,
    question: 'How do I create an account on MDBaise?',
    answer: 'To create an account, click the "Join" button in the top right corner. You can sign up using your email address or connect with your Google account. Fill in your basic information and verify your email to get started.',
    category: 'account',
  },
  {
    id: 2,
    question: 'Can I use MDBaise without creating an account?',
    answer: 'You can browse doctor profiles and read reviews without an account. However, to book appointments, message providers, or leave reviews, you\'ll need to create a free account.',
    category: 'account',
  },
  {
    id: 3,
    question: 'How do I reset my password?',
    answer: 'Click "Login" then "Forgot Password". Enter your registered email address and we\'ll send you a secure link to reset your password. The link expires after 24 hours for security.',
    category: 'account',
  },
  {
    id: 4,
    question: 'How do I book an appointment with a doctor?',
    answer: 'Find a doctor using our search feature, then visit their profile. Click "Book Appointment" to see available time slots. Select your preferred date and time, choose between in-person or teleconsultation, and confirm your booking.',
    category: 'booking',
  },
  {
    id: 5,
    question: 'Can I cancel or reschedule my appointment?',
    answer: 'Yes, you can cancel or reschedule appointments from your dashboard. Most providers require at least 24 hours notice for cancellations. Check the provider\'s cancellation policy on their profile for specific terms.',
    category: 'booking',
  },
  {
    id: 6,
    question: 'How far in advance can I book appointments?',
    answer: 'Booking availability varies by provider. Most doctors allow bookings up to 30 days in advance. Some specialists may have longer booking windows. Check the provider\'s calendar for their available slots.',
    category: 'booking',
  },
  {
    id: 7,
    question: 'What payment methods are accepted?',
    answer: 'MDBaise accepts major credit cards (Visa, Mastercard, American Express), debit cards, and PIX for Brazilian users. Some providers may also accept insurance - check their profile for accepted plans.',
    category: 'payments',
  },
  {
    id: 8,
    question: 'When am I charged for an appointment?',
    answer: 'For most appointments, your card is authorized at booking and charged after the consultation is completed. Teleconsultations may require upfront payment. Cancellations within the allowed window are fully refunded.',
    category: 'payments',
  },
  {
    id: 9,
    question: 'How do I request a refund?',
    answer: 'If you need a refund, go to your appointment history, select the appointment, and click "Request Refund". Provide a reason and our team will review within 2-3 business days. Eligible refunds are processed to your original payment method.',
    category: 'payments',
  },
  {
    id: 10,
    question: 'How do I join a teleconsultation?',
    answer: 'Before your appointment, ensure you have a stable internet connection and allow camera/microphone access. At your scheduled time, go to "My Appointments" and click "Join Call". The video call will open in your browser - no downloads needed.',
    category: 'teleconsultation',
  },
  {
    id: 11,
    question: 'What if I have technical issues during a teleconsultation?',
    answer: 'If you experience issues, try refreshing the page or switching browsers. Check your internet connection and device permissions. If problems persist, you can message your provider to reschedule. Technical issues are grounds for a full refund.',
    category: 'teleconsultation',
  },
  {
    id: 12,
    question: 'Are teleconsultations secure and private?',
    answer: 'Yes, all teleconsultations use end-to-end encryption and comply with healthcare privacy regulations (LGPD/HIPAA). Calls are not recorded unless both parties consent. Your health information is protected and confidential.',
    category: 'teleconsultation',
  },
  {
    id: 13,
    question: 'How do I become a provider on MDBaise?',
    answer: 'Click "Join" and select "Healthcare Provider". Complete your professional profile including your CRM number, specialty, and credentials. Upload required documents for verification. Once approved, you can start accepting appointments.',
    category: 'providers',
  },
  {
    id: 14,
    question: 'What are the fees for providers?',
    answer: 'MDBaise offers tiered subscription plans. Free accounts can receive up to 5 bids/month. Pro and Elite plans offer unlimited bids, priority placement, and additional features. A small transaction fee applies to completed appointments.',
    category: 'providers',
  },
  {
    id: 15,
    question: 'How do I verify my medical credentials?',
    answer: 'Upload your CRM certificate, medical degree, and any specialty certifications to your provider dashboard. Our verification team reviews documents within 2-5 business days. Verified providers receive a badge on their profile.',
    category: 'providers',
  },
  {
    id: 16,
    question: 'How do I manage my availability?',
    answer: 'Go to Provider Dashboard > Availability. Set your regular working hours for each day of the week. You can block specific dates, set vacation mode, and adjust consultation duration. Changes sync immediately to your booking calendar.',
    category: 'providers',
  },
];

export function FAQSection({ searchQuery }: FAQSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {faqCategories.map((cat) => (
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
            <cat.icon className="w-4 h-4 mr-2" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <Accordion type="single" collapsible className="space-y-3">
        {filteredFAQs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={`faq-${faq.id}`}
            className="bg-card/50 border border-border/50 rounded-xl px-6 data-[state=open]:border-cyan-500/30"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 capitalize">
                  {faq.category}
                </Badge>
                <span className="font-medium text-foreground">{faq.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No FAQs found matching your search</p>
          <Button
            variant="link"
            className="text-cyan-400 mt-2"
            onClick={() => setSelectedCategory('all')}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Help CTA */}
      <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
        <p className="text-muted-foreground mb-4">Can't find what you're looking for?</p>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <MessageSquare className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </div>
    </div>
  );
}
