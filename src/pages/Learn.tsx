import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, HelpCircle, FileText, GraduationCap, PlayCircle, ChevronRight } from 'lucide-react';
import { FAQSection } from '@/components/learn/FAQSection';
import { TutorialsSection } from '@/components/learn/TutorialsSection';
import { SOPSection } from '@/components/learn/SOPSection';
import { GettingStartedSection } from '@/components/learn/GettingStartedSection';
import { VideoTutorialsSection } from '@/components/learn/VideoTutorialsSection';

export default function Learn() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: GraduationCap, count: 8 },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle, count: 24 },
    { id: 'tutorials', label: 'Step-by-Step Tutorials', icon: BookOpen, count: 15 },
    { id: 'videos', label: 'Video Guides', icon: PlayCircle, count: 12 },
    { id: 'sops', label: 'SOPs & Procedures', icon: FileText, count: 18 },
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
              <span className="text-sm text-cyan-400 font-medium">Learning Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              MDBaise Academy
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Master every feature of the platform with comprehensive tutorials, FAQs, and standard operating procedures
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search tutorials, FAQs, and guides..."
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
                <p className="text-xs text-muted-foreground">{cat.count} articles</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Tabs defaultValue="getting-started" className="w-full">
            <TabsList className="w-full justify-start bg-card/50 border border-border/50 rounded-xl p-1 mb-8 overflow-x-auto flex-nowrap">
              <TabsTrigger value="getting-started" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                <GraduationCap className="w-4 h-4 mr-2" />
                Getting Started
              </TabsTrigger>
              <TabsTrigger value="faqs" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="tutorials" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                <BookOpen className="w-4 h-4 mr-2" />
                Tutorials
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                <PlayCircle className="w-4 h-4 mr-2" />
                Video Guides
              </TabsTrigger>
              <TabsTrigger value="sops" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white rounded-lg px-4">
                <FileText className="w-4 h-4 mr-2" />
                SOPs
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
        </div>

        {/* Version Info Footer */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="bg-card/50 border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Documentation last updated: <span className="text-foreground font-medium">December 2024</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform Version: 2.0 • Content auto-updates with each release
                </p>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 text-sm">
                <span>Suggest an improvement</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
