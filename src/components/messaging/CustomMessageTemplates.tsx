import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Crown, 
  Send, 
  Plus,
  Trash2,
  Edit2,
  Save,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

const messageSchema = z.object({
  channel: z.enum(['email', 'sms', 'whatsapp']),
  recipient: z.string().min(1, 'Recipient is required'),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface CustomMessageTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerTier: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
}

const defaultTemplates = {
  email: [
    { id: '1', name: 'Quote Follow-up', subject: 'Your Quote Request', body: 'Hi {{name}}, thank you for your quote request. I wanted to follow up...' },
    { id: '2', name: 'Job Confirmation', subject: 'Job Confirmed', body: 'Hi {{name}}, your job has been confirmed for {{date}}...' },
    { id: '3', name: 'Completion Notice', subject: 'Work Completed', body: 'Hi {{name}}, the work has been completed. Please review...' },
  ],
  sms: [
    { id: '1', name: 'Appointment Reminder', body: 'Hi {{name}}, reminder: your appointment is tomorrow at {{time}}.' },
    { id: '2', name: 'On My Way', body: 'Hi {{name}}, I\'m on my way. ETA: {{eta}}.' },
    { id: '3', name: 'Job Complete', body: 'Hi {{name}}, work is done! Please check and confirm.' },
  ],
  whatsapp: [
    { id: '1', name: 'Welcome', body: 'Hi {{name}}! Thank you for choosing our services. How can I help?' },
    { id: '2', name: 'Quote Ready', body: 'Hi {{name}}, your quote is ready: R${{amount}}. Reply YES to confirm.' },
    { id: '3', name: 'Review Request', body: 'Hi {{name}}, hope you\'re happy with the work! Would you leave us a review?' },
  ],
};

export function CustomMessageTemplates({
  open,
  onOpenChange,
  providerTier,
  recipientEmail,
  recipientPhone,
  recipientName,
}: CustomMessageTemplatesProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const isEliteOrAbove = providerTier === 'elite' || providerTier === 'enterprise';

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      channel: 'email',
      recipient: recipientEmail || recipientPhone || '',
      subject: '',
      message: '',
    },
  });

  const handleTemplateSelect = (template: typeof defaultTemplates.email[0]) => {
    setSelectedTemplate(template.id);
    let message = template.body;
    if (recipientName) {
      message = message.replace(/\{\{name\}\}/g, recipientName);
    }
    form.setValue('message', message);
    if ('subject' in template) {
      form.setValue('subject', template.subject);
    }
  };

  const onSubmit = async (data: MessageFormValues) => {
    if (!isEliteOrAbove) {
      toast.error(t('customMessages.eliteRequired'));
      return;
    }

    setIsSending(true);
    
    // Simulate sending (would connect to actual SMS/Email/WhatsApp API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(t('customMessages.sent', { channel: data.channel }));
    setIsSending(false);
    form.reset();
    onOpenChange(false);
  };

  const channelConfig = {
    email: { icon: Mail, label: 'Email', color: 'text-blue-500' },
    sms: { icon: MessageSquare, label: 'SMS', color: 'text-green-500' },
    whatsapp: { icon: Phone, label: 'WhatsApp', color: 'text-emerald-500' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t('customMessages.title')}
            <Badge className="bg-amber-500 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Elite+
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {t('customMessages.description')}
          </DialogDescription>
        </DialogHeader>

        {!isEliteOrAbove ? (
          <div className="bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 rounded-lg p-6 text-center">
            <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h4 className="font-semibold text-lg mb-2">{t('customMessages.eliteFeature')}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {t('customMessages.upgradeDescription')}
            </p>
            <Button className="bg-amber-500 hover:bg-amber-600">
              {t('common.upgradeToElite')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                {Object.entries(channelConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={key} value={key} className="text-xs">
                      <Icon className={`h-4 w-4 mr-1 ${config.color}`} />
                      {config.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(defaultTemplates).map(([channel, templates]) => (
                <TabsContent key={channel} value={channel} className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('customMessages.quickTemplates')}
                    </p>
                    {templates.map((template) => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-all hover:border-primary ${
                          selectedTemplate === template.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {template.body.substring(0, 60)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {activeTab === 'email' ? t('customMessages.emailAddress') : t('customMessages.phoneNumber')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={activeTab === 'email' ? 'email@example.com' : '+55 11 99999-9999'}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {activeTab === 'email' && (
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('customMessages.subject')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('customMessages.subjectPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customMessages.message')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('customMessages.messagePlaceholder')}
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSending}>
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('customMessages.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t('customMessages.send')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
