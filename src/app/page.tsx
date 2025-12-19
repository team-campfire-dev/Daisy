'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Settings } from 'lucide-react';
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
  const [showIntro, setShowIntro] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  // Derived
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || null;

  // Load context from session on mount
  useEffect(() => {
    async function loadContext() {
      try {
        const response = await fetch('/api/context');
        const data = await response.json();

        if (data.context) {
          const ctx = data.context as UserContext;

          // Check if date is still valid (not in the past)
          const contextDate = new Date(ctx.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (contextDate >= today) {
            // Valid session with future/today date
            setUserContext(ctx);
            setShowIntro(false);
            console.log('[Session] Loaded context from session:', ctx);
          } else {
            console.log('[Session] Context date has passed, showing intro');
          }
        }
      } catch (error) {
        console.error('[Session] Failed to load context:', error);
      } finally {
        setIsLoadingContext(false);
      }
    }

    loadContext();
  }, []);

  // Load chat history from session
  useEffect(() => {
    async function loadHistory() {
      if (!userContext) return; // Only load if we have a valid context

      try {
        const response = await fetch('/api/context?type=history');
        const data = await response.json();

        if (data.history && Array.isArray(data.history) && data.history.length > 0) {
          setMessages(data.history);
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions);
          }
          if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
            setPlans(data.plans);
            if (data.selectedPlanId) {
              setSelectedPlanId(data.selectedPlanId);
            } else {
              setSelectedPlanId(data.plans[0].id);
            }
          }
          console.log('[Session] Loaded chat history:', data.history.length, 'messages,', data.plans?.length || 0, 'plans');
        } else {
          // No chat history found - fetch initial greeting
          console.log('[Session] No chat history, fetching initial greeting');
          setIsGenerating(true);
          setLoadingStatus("데이지와 연결 중...");

          try {
            const greetingResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: "HELLO_DAISY",
                history: [],
                systemContext: getFormattedContext(userContext),
                transportMode: userContext.transport
              })
            });
            const greetingData: CourseResponse = await greetingResponse.json();
            setMessages([{ role: 'assistant', content: greetingData.conversationResponse }]);
            if (greetingData.suggestedReplies) setSuggestions(greetingData.suggestedReplies);
          } catch (e) {
            console.error('[Session] Failed to fetch greeting:', e);
          } finally {
            setIsGenerating(false);
          }
        }
      } catch (error) {
        console.error('[Session] Failed to load chat history:', error);
      }
    }

    loadHistory();
  }, [userContext]); // Load when userContext is set

  // Save chat history, suggestions, and plans whenever they change
  useEffect(() => {
    async function saveData() {
      if (messages.length === 0) return; // Don't save empty state

      try {
        await fetch('/api/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: messages,
            suggestions: suggestions,
            plans: plans,
            selectedPlanId: selectedPlanId
          })
        });
        console.log('[Session] Saved chat data and plans');
      } catch (error) {
        console.error('[Session] Failed to save data:', error);
      }
    }

    // Debounce save to avoid too many requests
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [messages, suggestions, plans, selectedPlanId]);

  // Helper for context translation
  const getFormattedContext = (ctx: UserContext) => {
    const partnerMap: Record<string, string> = { 'Lover': '연인', 'Friend': '친구', 'Family': '가족', 'Blind Date': '소개팅' };
    const transportMap: Record<string, string> = { 'car': '자차', 'public': '대중교통', 'walk': '도보' };
    return `Date: ${ctx.date}, Time: ${ctx.time}, Partner: ${partnerMap[ctx.partner] || ctx.partner}, Transport: ${transportMap[ctx.transport] || ctx.transport}`;
  };

  const handleIntroComplete = async (ctx: UserContext, isUpdate: boolean = false) => {
    setUserContext(ctx);
    setShowIntro(false);
    setShowSettings(false);

    // Save context to session
    try {
      await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx })
      });
      console.log('[Session] Saved context to session');
    } catch (error) {
      console.error('[Session] Failed to save context:', error);
    }

    // If this is just a settings update, don't reset the chat
    if (isUpdate) {
      return;
    }

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
          systemContext: getFormattedContext(ctx),
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

    const ctxString = userContext ? getFormattedContext(userContext) : "";
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
    const ctxString = userContext ? getFormattedContext(userContext) : "";
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

  // New Chat Handler
  async function handleNewChat() {
    // Clear messages and plans
    setMessages([]);
    setPlans([]);
    setSelectedPlanId(null);
    setSuggestions([]);

    // Clear chat history from session
    try {
      await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [] })
      });
    } catch (error) {
      console.error('[Session] Failed to clear chat history:', error);
    }

    // Start fresh greeting
    if (userContext) {
      setIsGenerating(true);
      setLoadingStatus("데이지와 연결 중...");

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "HELLO_DAISY",
            history: [],
            systemContext: getFormattedContext(userContext),
            transportMode: userContext.transport
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
    }
  }

  const handleStepClick = (step: CourseStep) => {
    setActiveStep(step);
    setIsModalOpen(true);
  };

  // Don't render main content until we've checked for session
  if (isLoadingContext) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-slate-950 to-fuchsia-950/20" />

        <div className="relative z-10 text-center space-y-6">
          {/* Daisy Logo */}
          <div className="relative inline-block">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tighter animate-pulse">
              Daisy
            </h1>
            <span className="absolute -top-1 -right-6 text-3xl">🌼</span>
          </div>

          {/* Loading text */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-slate-300 text-lg font-light">
              데이지를 불러오는 중
            </p>

            {/* Animated loading dots */}
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>

          {/* Subtle hint text */}
          <p className="text-slate-500 text-sm font-medium mt-4">
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen relative overflow-hidden bg-slate-950">

      {/* Intro Overlay - Only show if no valid session */}
      {showIntro && <IntroOverlay onComplete={handleIntroComplete} />}

      {/* Settings Modal - Edit mode */}
      {showSettings && (
        <IntroOverlay
          onComplete={(ctx) => handleIntroComplete(ctx, true)}
          initialContext={userContext || undefined}
          editMode={true}
        />
      )}

      {/* Settings Button - Top Right */}
      {!showIntro && !showSettings && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-6 right-6 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 border border-white/10 rounded-full backdrop-blur-xl transition-all group"
          title="설정"
        >
          <Settings className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all" />
        </button>
      )}

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
            onNewChat={handleNewChat}
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