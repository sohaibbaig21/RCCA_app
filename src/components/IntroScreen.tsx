import React, { useState, useEffect } from 'react';
import { ChevronRight, Target, TrendingUp, Shield, Users } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const timersRef = React.useRef<{ intervals: number[]; timeouts: number[] }>({ intervals: [], timeouts: [] });
  const [skipped, setSkipped] = useState(false);

  const steps = [
    {
      icon: Target,
      title: "Root Cause Analysis",
      description: "Identify the fundamental cause of problems to prevent recurrence"
    },
    {
      icon: TrendingUp,
      title: "Continuous Improvement",
      description: "Drive systematic improvements across your organization"
    },
    {
      icon: Shield,
      title: "Risk Prevention",
      description: "Proactively prevent issues before they impact operations"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together to solve problems and share knowledge"
    }
  ];

  useEffect(() => {
    if (skipped) return;
    // Progress interval
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 100);
    timersRef.current.intervals.push(progressInterval as unknown as number);

    // Step interval
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2500);
    timersRef.current.intervals.push(stepInterval as unknown as number);

    // Auto-complete timeout
    const autoComplete = setTimeout(() => {
      if (!skipped) onComplete();
    }, 10000);
    timersRef.current.timeouts.push(autoComplete as unknown as number);

    return () => {
      console.log('Cleaning up timers in IntroScreen');
      timersRef.current.intervals.forEach(clearInterval);
      timersRef.current.timeouts.forEach(clearTimeout);
      timersRef.current.intervals = [];
      timersRef.current.timeouts = [];
    };
  }, [onComplete, skipped]);

  const handleSkip = () => {
    console.log('Skip Intro button clicked');
    setSkipped(true);
    // Clear all timers immediately
    timersRef.current.intervals.forEach(id => clearInterval(id));
    timersRef.current.timeouts.forEach(id => clearTimeout(id));
    timersRef.current.intervals = [];
    timersRef.current.timeouts = [];
    onSkip();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-blue-950 to-blue-900">
      {/* Animated background patterns */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-blue-300 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-200 rounded-full animate-ping"></div>
          <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-white rounded-full animate-pulse"></div>
        </div>
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-8 z-10 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all duration-300 flex items-center gap-2 group"
      >
        Skip Intro
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 pointer-events-none">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
            RCCA System
          </h1>
          <p className="text-2xl text-blue-100 mb-8 max-w-2xl">
            Root Cause Corrective Action Management Platform
          </p>
        </div>

        {/* Animated step display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-2xl w-full mb-12 border border-white/20 pointer-events-none">
          <div className="flex flex-col items-center text-center">
            {React.createElement(steps[currentStep].icon, {
              className: "w-20 h-20 text-white mb-6 animate-bounce"
            })}
            <h2 className="text-3xl font-bold text-white mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="bg-white/20 rounded-full h-3 mb-4">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-white/80 text-sm">
            Loading... {progress}%
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;