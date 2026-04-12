import { useTranslation } from 'react-i18next';

export function BaiseAppsPromo() {
  const { i18n } = useTranslation();
  const isPt = (i18n.language || '').startsWith('pt');

  const apps = [
    {
      name: 'Casa Baise',
      tagline: isPt ? 'Encontre profissionais de servi\u00e7os dom\u00e9sticos' : 'Find trusted home service professionals',
      url: 'https://casabaise.com',
      color: '#1dbf73',
      initial: 'C',
    },
    {
      name: 'Legal Baise',
      tagline: isPt ? 'Conecte-se com advogados e profissionais jur\u00eddicos' : 'Connect with lawyers & legal professionals',
      url: 'https://legalbaise.com',
      color: '#7c3aed',
      initial: 'L',
    },
  ];

  return (
    <section className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg font-bold text-foreground mb-4 text-center">
          {isPt ? 'Explore a Fam\u00edlia Baise' : 'Explore the Baise Family'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg transition-all group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}cc)` }}
              >
                <span className="text-white font-bold text-sm">{app.initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {app.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">{app.tagline}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
