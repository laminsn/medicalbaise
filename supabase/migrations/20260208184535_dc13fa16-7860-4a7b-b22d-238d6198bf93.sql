
-- Create provider email campaigns table
CREATE TABLE public.provider_email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  recipient_type TEXT NOT NULL DEFAULT 'followers', -- 'followers' or 'all_contacts'
  total_recipients INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_failed INTEGER NOT NULL DEFAULT 0,
  cost_per_email NUMERIC NOT NULL DEFAULT 0.05,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sending', 'completed', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_email_campaigns ENABLE ROW LEVEL SECURITY;

-- Providers can view their own campaigns
CREATE POLICY "Providers can view own campaigns"
ON public.provider_email_campaigns
FOR SELECT
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can create campaigns
CREATE POLICY "Providers can create own campaigns"
ON public.provider_email_campaigns
FOR INSERT
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can update their own draft campaigns
CREATE POLICY "Providers can update own campaigns"
ON public.provider_email_campaigns
FOR UPDATE
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.provider_email_campaigns
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_provider_email_campaigns_updated_at
BEFORE UPDATE ON public.provider_email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
