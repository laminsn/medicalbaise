import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Copy, Check, MessageSquare, Mail, Smartphone, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { SITE_DOMAIN } from '@/lib/constants';

interface ProfileShareSectionProps {
  handle?: string | null;
  referralCode?: string | null;
}

export function ProfileShareSection({ handle, referralCode }: ProfileShareSectionProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const profileShareUrl = handle
    ? `${SITE_DOMAIN}/@${handle}`
    : `${SITE_DOMAIN}/browse`;

  const shareUrl = referralCode
    ? `${SITE_DOMAIN}/auth?ref=${referralCode}`
    : SITE_DOMAIN;

  const shareMessage = t('profile.shareMessage', { code: referralCode || '' });
  const fullShareText = `${shareMessage} ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileShareUrl);
      setCopied(true);
      toast.success(t('profile.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('profile.copyFailed'));
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank'),
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank'),
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    },
    {
      name: 'X',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`, '_blank'),
    },
    {
      name: 'SMS',
      icon: <Smartphone className="w-5 h-5" />,
      action: () => window.open(`sms:?body=${encodeURIComponent(fullShareText)}`, '_self'),
    },
    {
      name: 'E-mail',
      icon: <Mail className="w-5 h-5" />,
      action: () => window.open(`mailto:?subject=${encodeURIComponent('MDBaise')}&body=${encodeURIComponent(fullShareText)}`, '_self'),
    },
    {
      name: 'QR',
      icon: <QrCode className="w-5 h-5" />,
      action: () => setShowQR(!showQR),
      highlight: false,
    },
    {
      name: t('common.more', 'More'),
      icon: <Share2 className="w-5 h-5" />,
      action: () => {
        if (navigator.share) {
          navigator.share({ title: 'MDBaise', text: shareMessage, url: shareUrl });
        } else {
          handleCopyLink();
        }
      },
      highlight: true,
    },
  ];

  return (
    <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
          <Share2 className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-foreground">{t('profile.shareProfile')}</h3>
      </div>

      {referralCode && (
        <p className="text-xs text-muted-foreground mb-2">
          {t('profile.yourReferralCode')}: <span className="font-mono font-semibold text-primary">{referralCode}</span>
        </p>
      )}

      {handle && (
        <p className="text-xs text-muted-foreground mb-3">
          {t('profile.yourProfileLink', 'Your profile link')}: <span className="font-mono font-semibold text-primary">{profileShareUrl}</span>
        </p>
      )}

      {/* Share grid - matches Casa Baise layout */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {shareOptions.map((option) => (
          <button
            key={option.name}
            onClick={option.action}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-colors ${
              option.highlight
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            {option.icon}
            <span className="text-xs font-medium">{option.name}</span>
          </button>
        ))}
      </div>

      {/* Copy link button */}
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={handleCopyLink}
      >
        {copied ? (
          <Check className="w-4 h-4 mr-2 text-primary" />
        ) : (
          <Copy className="w-4 h-4 mr-2" />
        )}
        {copied ? t('profile.copied') : t('profile.copyLink')}
      </Button>

      {/* QR Code section */}
      {showQR && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-1">
            {t('profile.scanQRCode', 'Scan QR code')}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            {t('profile.useCamera', 'Use your camera to open this link.')}
          </p>
          <div className="flex justify-center bg-white rounded-xl p-4">
            <QRCodeSVG
              value={profileShareUrl}
              size={180}
              level="H"
              includeMargin
            />
          </div>
        </div>
      )}
    </div>
  );
}
