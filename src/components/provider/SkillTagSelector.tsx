import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { PLATFORM } from '@/integrations/supabase/client';
import { CheckCircle2 } from 'lucide-react';

interface SkillTag {
  id: string;
  name_en: string;
  name_pt: string;
  category_id: string;
}

interface SkillTagSelectorProps {
  providerId: string;
  categoryId?: string;
  onUpdate?: () => void;
}

export function SkillTagSelector({ providerId, categoryId, onUpdate }: SkillTagSelectorProps) {
  const { i18n } = useTranslation();
  const isPt = (i18n.language || '').startsWith('pt');
  const [tags, setTags] = useState<SkillTag[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch available tags for this platform
      let query = supabase
        .from('skill_tags')
        .select('id, name_en, name_pt, category_id')
        .eq('platform', PLATFORM);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: tagsData } = await query.order('name_en');

      // Fetch provider's selected tags
      const { data: selectedData } = await supabase
        .from('provider_skills')
        .select('skill_tag_id')
        .eq('provider_id', providerId);

      if (tagsData) setTags(tagsData);
      if (selectedData) {
        setSelectedIds(new Set(selectedData.map((s: { skill_tag_id: string }) => s.skill_tag_id)));
      }
      setLoading(false);
    };

    if (providerId) fetchData();
  }, [providerId, categoryId]);

  const toggleTag = async (tagId: string) => {
    setSaving(true);
    const isSelected = selectedIds.has(tagId);

    if (isSelected) {
      await supabase
        .from('provider_skills')
        .delete()
        .eq('provider_id', providerId)
        .eq('skill_tag_id', tagId);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(tagId);
        return next;
      });
    } else {
      await supabase
        .from('provider_skills')
        .insert({ provider_id: providerId, skill_tag_id: tagId });
      setSelectedIds(prev => new Set([...prev, tagId]));
    }

    setSaving(false);
    onUpdate?.();
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  if (tags.length === 0) return null;

  // Group tags by category
  const groupedTags = tags.reduce((acc, tag) => {
    const key = tag.category_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tag);
    return acc;
  }, {} as Record<string, SkillTag[]>);

  return (
    <div className="space-y-3">
      {Object.entries(groupedTags).map(([catId, catTags]) => (
        <div key={catId} className="flex flex-wrap gap-2">
          {catTags.map(tag => {
            const isSelected = selectedIds.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3 h-3" />}
                {isPt ? tag.name_pt : tag.name_en}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Read-only display for profiles
export function SkillTagBadges({ providerId }: { providerId: string }) {
  const { i18n } = useTranslation();
  const isPt = (i18n.language || '').startsWith('pt');
  const [skills, setSkills] = useState<{ name_en: string; name_pt: string }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('provider_skills')
        .select('skill_tags(name_en, name_pt)')
        .eq('provider_id', providerId);

      if (data) {
        setSkills(data.map((d: any) => d.skill_tags).filter(Boolean));
      }
    };
    if (providerId) fetch();
  }, [providerId]);

  if (skills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {isPt ? skill.name_pt : skill.name_en}
        </Badge>
      ))}
    </div>
  );
}
