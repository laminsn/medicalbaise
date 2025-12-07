import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Crown, 
  Plus,
  Trash2,
  Edit2,
  Save,
  Loader2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplatesPanelProps {
  providerTier: string;
}

interface Template {
  id: string;
  name: string;
  subject?: string;
  body: string;
}

const defaultTemplates: Record<string, Template[]> = {
  email: [
    { id: '1', name: 'Quote Follow-up', subject: 'Your Quote Request', body: 'Hi {{name}}, thank you for your quote request. I wanted to follow up...' },
    { id: '2', name: 'Job Confirmation', subject: 'Job Confirmed', body: 'Hi {{name}}, your job has been confirmed for {{date}}...' },
    { id: '3', name: 'Completion Notice', subject: 'Work Completed', body: 'Hi {{name}}, the work has been completed. Please review...' },
  ],
  sms: [
    { id: '1', name: 'Appointment Reminder', body: 'Hi {{name}}, reminder: your appointment is tomorrow at {{time}}.' },
    { id: '2', name: 'On My Way', body: "Hi {{name}}, I'm on my way. ETA: {{eta}}." },
    { id: '3', name: 'Job Complete', body: 'Hi {{name}}, work is done! Please check and confirm.' },
  ],
  whatsapp: [
    { id: '1', name: 'Welcome', body: 'Hi {{name}}! Thank you for choosing our services. How can I help?' },
    { id: '2', name: 'Quote Ready', body: 'Hi {{name}}, your quote is ready: R${{amount}}. Reply YES to confirm.' },
    { id: '3', name: 'Review Request', body: "Hi {{name}}, hope you're happy with the work! Would you leave us a review?" },
  ],
};

export function MessageTemplatesPanel({ providerTier }: MessageTemplatesPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [templates, setTemplates] = useState(defaultTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Test message state
  const [testRecipient, setTestRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isEliteOrAbove = providerTier === 'elite' || providerTier === 'enterprise';

  const handleSaveTemplate = async (id: string, updates: Partial<Template>) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTemplates(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }));
    
    setEditingId(null);
    setIsSaving(false);
    toast.success(t('customMessages.templateSaved'));
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(t => t.id !== id)
    }));
    toast.success(t('customMessages.templateDeleted'));
  };

  const handleAddTemplate = () => {
    const newId = Date.now().toString();
    const newTemplate: Template = {
      id: newId,
      name: t('customMessages.newTemplate'),
      body: '',
      ...(activeTab === 'email' ? { subject: '' } : {})
    };
    
    setTemplates(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newTemplate]
    }));
    setEditingId(newId);
  };

  const handleSendTest = async () => {
    if (!testRecipient || !testMessage) {
      toast.error(t('customMessages.fillAllFields'));
      return;
    }
    
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(t('customMessages.testSent', { channel: activeTab }));
    setIsSending(false);
    setTestRecipient('');
    setTestMessage('');
  };

  const channelConfig = {
    email: { icon: Mail, label: 'Email', color: 'text-blue-500', placeholder: 'email@example.com' },
    sms: { icon: MessageSquare, label: 'SMS', color: 'text-green-500', placeholder: '+55 11 99999-9999' },
    whatsapp: { icon: Phone, label: 'WhatsApp', color: 'text-emerald-500', placeholder: '+55 11 99999-9999' },
  };

  return (
    <div className="space-y-6">
      {/* Templates Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('customMessages.title')}
              </CardTitle>
              <CardDescription>{t('customMessages.manageTemplates')}</CardDescription>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Crown className="w-3 h-3 mr-1" />
              Elite+
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              {Object.entries(channelConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger key={key} value={key} className="gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    {config.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(templates).map(([channel, channelTemplates]) => (
              <TabsContent key={channel} value={channel} className="space-y-4">
                <div className="space-y-3">
                  {channelTemplates.map((template) => (
                    <Card key={template.id} className="border-border/50">
                      <CardContent className="p-4">
                        {editingId === template.id ? (
                          <div className="space-y-3">
                            <Input
                              value={template.name}
                              onChange={(e) => setTemplates(prev => ({
                                ...prev,
                                [channel]: prev[channel].map(t => 
                                  t.id === template.id ? { ...t, name: e.target.value } : t
                                )
                              }))}
                              placeholder={t('customMessages.templateName')}
                            />
                            {channel === 'email' && (
                              <Input
                                value={template.subject || ''}
                                onChange={(e) => setTemplates(prev => ({
                                  ...prev,
                                  [channel]: prev[channel].map(t => 
                                    t.id === template.id ? { ...t, subject: e.target.value } : t
                                  )
                                }))}
                                placeholder={t('customMessages.subject')}
                              />
                            )}
                            <Textarea
                              value={template.body}
                              onChange={(e) => setTemplates(prev => ({
                                ...prev,
                                [channel]: prev[channel].map(t => 
                                  t.id === template.id ? { ...t, body: e.target.value } : t
                                )
                              }))}
                              placeholder={t('customMessages.messageBody')}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleSaveTemplate(template.id, template)}
                                disabled={isSaving}
                              >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                {t('common.save')}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                              >
                                {t('common.cancel')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{template.name}</p>
                              {template.subject && (
                                <p className="text-sm text-muted-foreground">
                                  {t('customMessages.subject')}: {template.subject}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.body}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => setEditingId(template.id)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full gap-2" onClick={handleAddTemplate}>
                  <Plus className="h-4 w-4" />
                  {t('customMessages.addTemplate')}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Send Test Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t('customMessages.sendTest')}
          </CardTitle>
          <CardDescription>{t('customMessages.sendTestDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('customMessages.recipient')}</Label>
              <Input
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={channelConfig[activeTab].placeholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('customMessages.selectTemplate')}</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                onChange={(e) => {
                  const template = templates[activeTab].find(t => t.id === e.target.value);
                  if (template) setTestMessage(template.body);
                }}
              >
                <option value="">{t('customMessages.chooseTemplate')}</option>
                {templates[activeTab].map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('customMessages.message')}</Label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder={t('customMessages.messagePlaceholder')}
              rows={3}
            />
          </div>
          <Button onClick={handleSendTest} disabled={isSending} className="w-full gap-2">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('customMessages.sending')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('customMessages.sendTestMessage')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
