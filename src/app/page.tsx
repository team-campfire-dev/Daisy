'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ChatInterface from '@/components/chat/ChatInterface';
import CourseSidebar from '@/components/CourseSidebar';
import PlaceDetailModal from '@/components/PlaceDetailModal';
import IntroOverlay, { UserContext } from '@/components/IntroOverlay';
import { CourseResponse, CoursePlan, CourseStep } from '@/services/gemini';

// Dynamic import for KakaoMap to avoid SSR issues
const KakaoMapComponent = dynamic(() => import('@/components/map/KakaoMapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-white/20">Loading Map...</div>
});

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("데이지가 생각 중...");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Course State
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<CourseStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Intro State
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  // Derived
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || null;

  const handleIntroComplete = async (ctx: UserContext) => {
    setUserContext(ctx);

    //Start fresh chat
    setMessages([]);
    setIsGenerating(true);
    setLoadingStatus("데이지와 연결 중...");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "HELLO_DAISY",
          history: [],
          systemContext: `User Context: Date=${ctx.date}, Time=${ctx.time}, Partner=${ctx.partner}`,
          transportMode: ctx.transport
        })
      });
      const data: CourseResponse = await response.json();
      setMessages([{ role: 'assistant', content: data.conversationResponse }]);
      if (data.suggestedReplies) setSuggestions(data.suggestedReplies);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  async function handleSendMessage(content: string) {
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setLoadingStatus("답변을 작성 중...");
    setSuggestions([]);

    const ctxString = userContext ? `Date: ${userContext.date}, Time: ${userContext.time}, Partner: ${userContext.partner}, Transport: ${userContext.transport}` : "";
    const transportMode = userContext?.transport || 'public';

    // UI Feedback for Planning
    const planKeywords = ["계획", "추천", "짜줘", "알려줘", "코스"];
    if (planKeywords.some(keyword => content.includes(keyword))) {
      setLoadingStatus("데이트 장소를 찾는 중...");
      setTimeout(() => setLoadingStatus("이동 경로를 계산 중..."), 1500);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages,
          systemContext: ctxString,
          transportMode: transportMode
        })
      });

      const data: CourseResponse = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.conversationResponse }]);

      if (data.plans && data.plans.length > 0) {
        setPlans(data.plans);
        setSelectedPlanId(data.plans[0].id);
        // No need to trigger background crawl anymore
      }
      if (data.suggestedReplies) setSuggestions(data.suggestedReplies);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "오류가 발생했습니다." }]);
    } finally {
      setIsGenerating(false);
    }
  }

  // Explicit Plan Generation Trigger
  async function handleGeneratePlan() {
    setIsGenerating(true);
    setLoadingStatus("코스를 생성 중...");
    const ctxString = userContext ? `Date: ${userContext.date}, Time: ${userContext.time}, Partner: ${userContext.partner}` : "";
    const transportMode = userContext?.transport || 'public';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "PLAN_NOW",
          history: messages,
          systemContext: ctxString,
          transportMode: transportMode
        })
      });
      const data: CourseResponse = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.conversationResponse }]);

      if (data.plans && data.plans.length > 0) {
        setPlans(data.plans);
        setSelectedPlanId(data.plans[0].id);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  }

  const handleStepClick = (step: CourseStep) => {
    setActiveStep(step);
    setIsModalOpen(true);
  };

  return (
    <main className="flex min-h-screen relative overflow-hidden bg-slate-950">

      {/* Intro Overlay */}
      <IntroOverlay onComplete={handleIntroComplete} />

      {/* Background Map (Full Screen - Kakao) */}
      <div className="absolute inset-0 z-0">
        <KakaoMapComponent
          plan={selectedPlan}
          onMarkerClick={handleStepClick}
        />
      </div>

      {/* Left Sidebar: Plan & Course Details */}
      <div className="absolute left-6 top-6 bottom-6 w-96 z-10 pointer-events-none flex flex-col gap-4">
        {plans.length > 0 && (
          <CourseSidebar
            plans={plans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onStepClick={handleStepClick}
          />
        )}
      </div>

      {/* Right Floating Chat */}
      <div className="absolute right-6 bottom-6 w-[450px] z-20 h-[720px] pointer-events-none">
        <div className="w-full h-full pointer-events-auto bg-transparent">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onGenerate={handleGeneratePlan}
            isGenerating={isGenerating}
            loadingStatus={loadingStatus}
            suggestions={suggestions}
          />
        </div>
      </div>

      {/* Modal */}
      <PlaceDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        placeName={activeStep?.placeName || ''}
        detail={activeStep?.detail}
        isLoading={false} // Details are already loaded via Gemini/Google Places
      />

    </main>
  );
}