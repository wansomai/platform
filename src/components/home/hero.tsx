// components/HeroSection.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

const HeroSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full screen
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    
    // Call once and add resize listener
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Animation parameters
    let time = 0;
    const speed = 0.0005; // Very slow, subtle animation
    
    // Draw smooth curved shape animation
    const animate = () => {
      // Clear canvas with light gray to white gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(220, 220, 220, 1)'); // Light gray
      gradient.addColorStop(1, 'rgba(255, 255, 255, 1)'); // White
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw large curved shape (right side)
      ctx.fillStyle = 'rgba(245, 245, 245, 0.9)';
      ctx.beginPath();
      
      // Starting point (top right)
      const startX = canvas.width;
      const startY = 0;
      
      // Control points for the subtle animation
      const animationOffset = Math.sin(time) * 30;
      
      // Draw a large curved shape
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(
        canvas.width * 0.6 - animationOffset, canvas.height * 0.2,  // First control point
        canvas.width * 0.7 + animationOffset, canvas.height * 0.5,  // Second control point
        canvas.width, canvas.height                               // End point
      );
      
      ctx.fill();
      
      // Draw another curved shape for additional depth
      ctx.fillStyle = 'rgba(235, 235, 235, 0.7)';
      ctx.beginPath();
      
      // Starting from the right middle
      ctx.moveTo(canvas.width, canvas.height * 0.3);
      
      // Create a sweeping curve
      ctx.bezierCurveTo(
        canvas.width * 0.5 + animationOffset * 0.7, canvas.height * 0.4, // First control point
        canvas.width * 0.6 - animationOffset * 0.5, canvas.height * 0.7, // Second control point
        canvas.width, canvas.height * 0.9                              // End point
      );
      
      ctx.fill();
      
      // Update time for subtle animation
      time += speed;
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <section className="relative pt-40 pb-20 overflow-hidden">
      {/* Animated Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full z-0"
      />
      
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="text-bold text-3xl md:text-6xl font-bold font-marcellus mb-4 text-gray-800">
          Legal Workspace that Saves you time.
        </h1>
        
        <Sparkles className='w-10 h-10 text-green-600 mx-auto'/>
        
        <p className="text-lg md:text-xl max-w-4xl mx-auto mb-8 font-jost text-gray-700">
          Our AI automates routine legal processes, so you can focus on high-impact work.
        </p>
        
        <button 
          className="font-medium uppercase flex gap-1 items-center mx-auto text-white bg-[#005c4d] hover:bg-yellow-600 rounded-md py-3 px-6 mb-10"
          onClick={() => window.location.href = '/register'}
        >
          TRY IT FOR FREE <Sparkles className='w-5 h-5 text-white'/>
        </button>
        
        <div className="flex flex-col md:flex-row justify-center items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="uppercase tracking-wide font-semibold mr-6 text-gray-800 font-jost">
              TRUSTED BY
            </span>
            <div className="flex text-green-700 font-jost font-bold">
              +180 Firms 
            </div>
          </div>
          
          <div className="mx-6 h-6 border-r border-gray-300 hidden md:block"></div>
          
          <div className="flex items-center">
            <span className="text-lg font-semibold mr-2 text-gray-800">G2</span>
            <span className="text-lg font-semibold mr-2 text-gray-800">4.8</span>
            <div className="flex text-yellow-400">
              {'★★★★★'}
            </div>
          </div>
        </div>
        
        {/* Contract Editor Preview */}
        <div className="relative max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          <img src='/images/home.png' alt="Wakili Chat Interface" className="w-full"/>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;