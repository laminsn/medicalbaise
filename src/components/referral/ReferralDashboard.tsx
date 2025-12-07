import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Share2, 
  Copy, 
  Gift, 
  Users, 
  TrendingUp, 
  Award,
  MessageCircle,
  Mail,
  ExternalLink,
  Check,
  QrCode,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const REFERRAL_TIERS = [
  { count: 5, bonus: 50, totalEarned: 150, badgeKey: null },
  { count: 10, bonus: 150, totalEarned: 350, badgeKey: 'featuredBadge' },
  { count: 20, bonus: 400, totalEarned: 850, badgeKey: 'vipStatus6Months' },
  { count: 50, bonus: 1500, totalEarned: 2500, badgeKey: 'lifetimeVip' },
];

const PROVIDER_TIERS = [
  { count: 3, bonus: 100, subscriptionKey: 'freeMonth1' },
  { count: 5, bonus: 300, subscriptionKey: 'freeMonths2' },
  { count: 10, bonus: 800, subscriptionKey: 'freeMonths3Elite' },
  { count: 20, bonus: 2000, subscriptionKey: 'freeMonths6Enterprise' },
];

// Mock data - replace with real data from Supabase
const mockReferrals = [
  { id: '1', name: 'Maria S.', status: 'credited', date: '2024-12-01', amount: 20 },
  { id: '2', name: 'João P.', status: 'active', date: '2024-12-03', amount: 20 },
  { id: '3', name: 'Ana L.', status: 'pending', date: '2024-12-04', amount: 20 },
];

export function ReferralDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const referralCode = profile?.referral_code || 'LOADING';
  const referralLink = `brasilbase.com/ref/${referralCode}`;
  
  const totalReferrals = mockReferrals.length;
  const creditedReferrals = mockReferrals.filter(r => r.status === 'credited').length;
  const pendingReferrals = mockReferrals.filter(r => r.status === 'pending').length;
  const totalEarned = creditedReferrals * 20;
  const pendingEarnings = pendingReferrals * 20;

  const currentTier = REFERRAL_TIERS.findIndex(t => totalReferrals < t.count);
  const nextTier = REFERRAL_TIERS[currentTier] || REFERRAL_TIERS[REFERRAL_TIERS.length - 1];
  const progressToNextTier = currentTier >= 0 
    ? (totalReferrals / nextTier.count) * 100 
    : 100;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t('referral.copied'),
      description: t('referral.copiedDescription'),
    });
  };

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;
    
    const svg = qrCodeRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `brasil-base-referral-${referralCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: t('referral.qrDownloaded'),
        description: t('referral.qrDownloadedDescription'),
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareVia = (platform: string) => {
    const message = t('referral.shareMessage', { code: referralCode, link: referralLink });
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(`https://${referralLink}`);
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
      email: `mailto:?subject=Convite Brasil Base&body=${encodedMessage}`,
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'credited': return t('referral.creditedStatus');
      case 'active': return t('referral.activeStatus');
      case 'pending': return t('referral.pendingStatus');
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-emerald-500/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-full">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{t('referral.programTitle')}</CardTitle>
              <CardDescription>
                {t('referral.programDescription')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Referral Code */}
          <div className="bg-background rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">{t('referral.yourCode')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-bold tracking-wider text-primary">
                {referralCode}
              </code>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(referralCode)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-6 gap-2">
            <Button 
              variant="outline" 
              className="flex-col h-auto py-3"
              onClick={() => shareVia('whatsapp')}
            >
              <svg className="h-5 w-5 mb-1 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-col h-auto py-3"
              onClick={() => shareVia('facebook')}
            >
              <svg className="h-5 w-5 mb-1 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-xs">Facebook</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-col h-auto py-3"
              onClick={() => shareVia('twitter')}
            >
              <svg className="h-5 w-5 mb-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-xs">X</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-col h-auto py-3"
              onClick={() => shareVia('email')}
            >
              <Mail className="h-5 w-5 mb-1 text-orange-600" />
              <span className="text-xs">Email</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-col h-auto py-3"
              onClick={() => copyToClipboard(referralLink)}
            >
              {copied ? <Check className="h-5 w-5 mb-1 text-primary" /> : <Copy className="h-5 w-5 mb-1 text-muted-foreground" />}
              <span className="text-xs">{copied ? t('profile.copied') : 'Link'}</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-col h-auto py-3"
                >
                  <QrCode className="h-5 w-5 mb-1 text-primary" />
                  <span className="text-xs">QR Code</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">{t('referral.scanQrCode')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div ref={qrCodeRef} className="bg-white p-4 rounded-lg">
                    <QRCodeSVG 
                      value={`https://${referralLink}`}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('referral.qrCodeDescription')}
                  </p>
                  <code className="px-3 py-1 bg-muted rounded text-sm font-mono">
                    {referralCode}
                  </code>
                  <Button onClick={downloadQRCode} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {t('referral.downloadQrCode')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('referral.totalEarned')}</p>
                <p className="text-2xl font-bold text-primary">R${totalEarned}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('referral.pending')}</p>
                <p className="text-2xl font-bold text-amber-600">R${pendingEarnings}</p>
              </div>
              <Users className="h-8 w-8 text-amber-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Tier */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('referral.nextBonus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{totalReferrals} {t('referral.referrals')}</span>
              <span className="text-muted-foreground">{nextTier.count} {t('referral.forBonus', { amount: nextTier.bonus })}</span>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
            {nextTier.badgeKey && (
              <p className="text-xs text-muted-foreground mt-2">
                + {t(`referral.${nextTier.badgeKey}`)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('referral.yourReferrals')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">{t('referral.all')}</TabsTrigger>
              <TabsTrigger value="pending">{t('referral.pendingTab')}</TabsTrigger>
              <TabsTrigger value="credited">{t('referral.credited')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-3">
              {mockReferrals.map((referral) => (
                <div 
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">
                        {referral.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-xs text-muted-foreground">{referral.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        referral.status === 'credited' ? 'default' : 
                        referral.status === 'active' ? 'secondary' : 'outline'
                      }
                    >
                      {getStatusLabel(referral.status)}
                    </Badge>
                    <p className="text-sm font-medium mt-1">R${referral.amount}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="pending">
              {mockReferrals.filter(r => r.status === 'pending').map((referral) => (
                <div 
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <span className="font-medium text-amber-600">
                        {referral.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-xs text-muted-foreground">{referral.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{t('referral.pendingStatus')}</Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="credited">
              {mockReferrals.filter(r => r.status === 'credited').map((referral) => (
                <div 
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">
                        {referral.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-xs text-muted-foreground">{referral.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge>{t('referral.creditedStatus')}</Badge>
                    <p className="text-sm font-medium mt-1 text-primary">+R${referral.amount}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bonus Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            {t('referral.volumeBonus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {REFERRAL_TIERS.map((tier, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  totalReferrals >= tier.count 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      totalReferrals >= tier.count 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {tier.count}
                    </div>
                    <div>
                      <p className="font-medium">{t('referral.xReferrals', { count: tier.count })}</p>
                      {tier.badgeKey && (
                        <p className="text-xs text-muted-foreground">{t(`referral.${tier.badgeKey}`)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">+R${tier.bonus}</p>
                    <p className="text-xs text-muted-foreground">{t('referral.total')}: R${tier.totalEarned}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">{t('referral.programTerms')}</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t('referral.term1')}</li>
            <li>• {t('referral.term2')}</li>
            <li>• {t('referral.term3')}</li>
            <li>• {t('referral.term4')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}