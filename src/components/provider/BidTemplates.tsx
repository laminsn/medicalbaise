import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BidTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

interface BidTemplatesProps {
  onSelect?: (content: string) => void;
  mode?: 'manage' | 'select';
}

export function BidTemplates({ onSelect, mode = 'manage' }: BidTemplatesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BidTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`bid_templates_${user?.id}`);
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch {
        setTemplates([]);
      }
    }
  }, [user]);

  const persistTemplates = (updated: BidTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem(`bid_templates_${user?.id}`, JSON.stringify(updated));
  };

  const addTemplate = () => {
    if (!name.trim() || !content.trim()) return;
    const newTemplate: BidTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    persistTemplates([...templates, newTemplate]);
    setName('');
    setContent('');
    setShowForm(false);
    toast({ title: 'Template saved' });
  };

  const deleteTemplate = (id: string) => {
    persistTemplates(templates.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          {mode === 'select' ? 'Use a Template' : 'Proposal Templates'}
        </h4>
        {mode === 'manage' && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3 mr-1" /> New
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-3 space-y-2">
          <input
            placeholder="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
          />
          <textarea
            placeholder="Proposal text..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addTemplate}>Save Template</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <p className="text-xs text-muted-foreground">No templates yet.</p>
      )}

      {templates.map((t) => (
        <div
          key={t.id}
          className="border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{t.name}</span>
            <div className="flex gap-1">
              {mode === 'select' && onSelect && (
                <Button size="sm" variant="ghost" onClick={() => onSelect(t.content)}>
                  <Copy className="w-3 h-3 mr-1" /> Use
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
        </div>
      ))}
    </div>
  );
}
