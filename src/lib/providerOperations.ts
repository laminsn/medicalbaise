import { supabase } from '@/integrations/supabase/client';

type ProviderOperationSeverity = 'info' | 'warning' | 'critical';

type ProviderOperationInput = {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  severity?: ProviderOperationSeverity;
  metadata?: Record<string, unknown>;
};

export const recordProviderOperation = async (input: ProviderOperationInput) => {
  const { error } = await supabase.functions.invoke('record-provider-operation', {
    body: input,
  });

  if (error) throw error;
};

export const recordProviderOperationSilently = (input: ProviderOperationInput) => {
  void recordProviderOperation(input).catch(() => undefined);
};
