import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, HelpCircle, FileText, GraduationCap, PlayCircle, ChevronRight } from 'lucide-react';
import { FAQSection } from '@/components/learn/FAQSection';
import { TutorialsSection } from '@/components/learn/TutorialsSection';
import { SOPSection } from '@/components/learn/SOPSection';
import { GettingStartedSection } from '@/components/learn/GettingStartedSection';
import { VideoTutorialsSection } from '@/components/learn/VideoTutorialsSection';

export default function Learn() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'getting-started', label: isPt ? 'Primeiros passos' : 'Getting Started', icon: GraduationCap, count: 8 },
    { id: 'faqs', label: isPt ? 'Perguntas frequentes' : 'FAQs', icon: HelpCircle, count: 24 },
    { id: 'tutorials', label: isPt ? 'Tutoriais passo a passo' : 'Step-by-Step Tutorials', icon: BookOpen, count: 15 },
    { id: 'videos', label: isPt ? 'Guias em vídeo' : 'Video Guides', icon: PlayCircle, count: 12 },
    { id: 'sops', label: isPt ? 'POPs e procedimentos' : 'SOPs & Procedures', icon: FileText, count: 18 },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 via-background to-background py-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">{isPt ? 'Central de aprendizado' : 'Learning Center'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {isPt ? 'Academia MDBaise' : 'MDBaise Academy'}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {isPt
                ? 'Domine todos os recursos da plataforma com tutoriais completos, FAQs e procedimentos operacionais padrão'
                : 'Master every feature of the platform with comprehensive tutorials, FAQs, and standard operating procedures'}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={isPt ? 'Buscar tutoriais, FAQs e guias...' : 'Search tutorials, FAQs, and guides...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-card/50 border-border/50 rounded-xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-card/80 backdrop-blur border border-border/50 rounded-xl p-4 text-center hover:border-cyan-500/30 transition-all cursor-pointer group"
              >
                <cat.icon className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.count} {isPt ? 'artigos' : 'articles'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {isPt ? (
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 md:p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Conteúdo em tradução</h2>
              <p className="text-muted-foreground mb-4">
                A Central de Aprendizado está sendo totalmente traduzida para português.
                Enquanto finalizamos essa etapa, você pode acessar a versão completa em inglês.
              </p>
              <Button onClick={() => i18n.changeLanguage('en')}>
                Ver conteúdo completo em inglês
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="getting-started" className="w-full">
              <TabsList className="w-full justify-start bg-card/50 border border-border/50 rounded-xl p-1 mb-8 overflow-x-auto flex-nowrap">
                <TabsTrigger value="getting-started" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {isPt ? 'Primeiros passos' : 'Getting Started'}
                </TabsTrigger>
                <TabsTrigger value="faqs" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  FAQs
                </TabsTrigger>
                <TabsTrigger value="tutorials" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {isPt ? 'Tutoriais' : 'Tutorials'}
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {isPt ? 'Guias em vídeo' : 'Video Guides'}
                </TabsTrigger>
                <TabsTrigger value="sops" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                  <FileText className="w-4 h-4 mr-2" />
                  {isPt ? 'POPs' : 'SOPs'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="getting-started">
                <GettingStartedSection searchQuery={searchQuery} />
              </TabsContent>
              <TabsContent value="faqs">
                <FAQSection searchQuery={searchQuery} />
              </TabsContent>
              <TabsContent value="tutorials">
                <TutorialsSection searchQuery={searchQuery} />
              </TabsContent>
              <TabsContent value="videos">
                <VideoTutorialsSection searchQuery={searchQuery} />
              </TabsContent>
              <TabsContent value="sops">
                <SOPSection searchQuery={searchQuery} />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Version Info Footer */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="bg-card/50 border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isPt ? 'Documentação atualizada em:' : 'Documentation last updated:'} <span className="text-foreground font-medium">{isPt ? 'Dezembro de 2024' : 'December 2024'}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPt ? 'Versão da plataforma: 2.0 • O conteúdo é atualizado automaticamente a cada release' : 'Platform Version: 2.0 • Content auto-updates with each release'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 text-sm">
                <span>{isPt ? 'Sugerir uma melhoria' : 'Suggest an improvement'}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
