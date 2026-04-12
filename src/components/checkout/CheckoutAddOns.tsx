import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface CheckoutAddOnsProps {
  addOns: AddOn[];
  selectedAddOns: string[];
  onAddOnChange: (addOnId: string, selected: boolean) => void;
  isPro: boolean;
}

export function CheckoutAddOns({ addOns, selectedAddOns, onAddOnChange, isPro }: CheckoutAddOnsProps) {
  const { t } = useTranslation();

  if (!isPro) {
    return null;
  }

  const totalAddOns = addOns
    .filter(addon => selectedAddOns.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('checkout.addOns', 'Add-ons & Extras')}
          <Badge variant="secondary" className="ml-auto">
            {t('checkout.proFeature', 'Pro+')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addOns.map((addon) => (
          <div
            key={addon.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <Checkbox
              id={addon.id}
              checked={selectedAddOns.includes(addon.id)}
              onCheckedChange={(checked) => onAddOnChange(addon.id, checked as boolean)}
            />
            <div className="flex-1">
              <Label
                htmlFor={addon.id}
                className="text-sm font-medium cursor-pointer"
              >
                {addon.name}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {addon.description}
              </p>
            </div>
            <span className="text-sm font-semibold text-primary">
              +{formatPrice(addon.price)}
            </span>
          </div>
        ))}
        
        {selectedAddOns.length > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {t('checkout.addOnsTotal', 'Add-ons Total')}
            </span>
            <span className="font-semibold">{formatPrice(totalAddOns)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Default add-ons that providers can offer
export const DEFAULT_ADDONS: AddOn[] = [
  {
    id: 'priority',
    name: 'Priority Service',
    description: 'Get moved to the front of the queue for faster completion',
    price: 50.00,
  },
  {
    id: 'extended-warranty',
    name: 'Extended Warranty',
    description: '90-day extended warranty on all work performed',
    price: 75.00,
  },
  {
    id: 'premium-materials',
    name: 'Premium Materials',
    description: 'Upgrade to premium-grade materials for better durability',
    price: 100.00,
  },
  {
    id: 'photo-documentation',
    name: 'Photo Documentation',
    description: 'Detailed before/after photo documentation of all work',
    price: 25.00,
  },
  {
    id: 'cleanup-service',
    name: 'Full Cleanup Service',
    description: 'Complete cleanup and disposal of all debris after work',
    price: 40.00,
  },
];
