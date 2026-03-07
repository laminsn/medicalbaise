import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, HelpCircle, User, Calendar, CreditCard, Video, Shield, Star, Settings } from 'lucide-react';
import { faqs } from '@/data/learningCenterData';
import { faqCategories } from '@/data/learningCenterSOPsVideos';
import { useTranslation } from 'react-i18next';

interface FAQSectionProps {
  searchQuery: string;
}

const iconMap: Record<string, any> = {
  all: HelpCircle,
  account: User,
  booking: Calendar,
  payments: CreditCard,
  teleconsultation: Video,
  providers: Shield,
  features: Star,
  support: MessageSquare,
};

export function FAQSection({ searchQuery }: FAQSectionProps) {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryLabels: Record<string, { en: string; pt: string }> = {
    all: { en: 'All', pt: 'Todos' },
    account: { en: 'Account', pt: 'Conta' },
    booking: { en: 'Bookings', pt: 'Agendamentos' },
    payments: { en: 'Payments', pt: 'Pagamentos' },
    teleconsultation: { en: 'Teleconsultation', pt: 'Teleconsulta' },
    providers: { en: 'Providers', pt: 'Profissionais' },
    features: { en: 'Features', pt: 'Recursos' },
    support: { en: 'Support', pt: 'Suporte' },
  };

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
        {faqCategories.map((cat) => {
          const Icon = iconMap[cat.id] || HelpCircle;
          return (
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
              <Icon className="w-4 h-4 mr-2" />
              {isPt ? (categoryLabels[cat.id]?.pt ?? cat.label) : (categoryLabels[cat.id]?.en ?? cat.label)}
            </Button>
          );
        })}
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
                  {isPt ? (categoryLabels[faq.category]?.pt ?? faq.category) : (categoryLabels[faq.category]?.en ?? faq.category)}
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
          <p className="text-muted-foreground">{isPt ? 'Nenhuma FAQ encontrada para sua busca' : 'No FAQs found matching your search'}</p>
          <Button
            variant="link"
            className="text-cyan-400 mt-2"
            onClick={() => setSelectedCategory('all')}
          >
            {isPt ? 'Limpar filtros' : 'Clear filters'}
          </Button>
        </div>
      )}

      {/* Help CTA */}
      <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
        <p className="text-muted-foreground mb-4">{isPt ? 'Não encontrou o que procura?' : "Can't find what you're looking for?"}</p>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <MessageSquare className="w-4 h-4 mr-2" />
          {isPt ? 'Falar com suporte' : 'Contact Support'}
        </Button>
      </div>
    </div>
  );
}
