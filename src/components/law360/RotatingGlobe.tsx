'use client';

import { useEffect, useRef, useCallback } from 'react';

const RotatingGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any existing animation
    cancelAnimationFrame(animationRef.current);

    const dpr = window.devicePixelRatio || 1;
    const containerWidth = container.clientWidth;
    const size = Math.min(containerWidth, 600); // cap at 600px

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4; // 40% of canvas size
    let rotation = 0;

    // Dot grid points on the sphere
    const dots: { lat: number; lng: number }[] = [];
    const latStep = 12;
    const lngStep = 12;

    for (let lat = -90; lat <= 90; lat += latStep) {
      for (let lng = -180; lng < 180; lng += lngStep) {
        dots.push({ lat: (lat * Math.PI) / 180, lng: (lng * Math.PI) / 180 });
      }
    }

    // Connection arcs (simulating data flow between regions)
    const arcs = [
      { from: { lat: 40, lng: -74 }, to: { lat: 51, lng: 0 } },
      { from: { lat: 51, lng: 0 }, to: { lat: -1, lng: 36 } },
      { from: { lat: -1, lng: 36 }, to: { lat: 35, lng: 139 } },
      { from: { lat: 35, lng: 139 }, to: { lat: -33, lng: 151 } },
      { from: { lat: 40, lng: -74 }, to: { lat: -23, lng: -46 } },
    ].map((arc) => ({
      from: {
        lat: (arc.from.lat * Math.PI) / 180,
        lng: (arc.from.lng * Math.PI) / 180,
      },
      to: {
        lat: (arc.to.lat * Math.PI) / 180,
        lng: (arc.to.lng * Math.PI) / 180,
      },
    }));

    // Scale factors for detail sizes relative to canvas
    const scale = size / 400;

    function project(lat: number, lng: number, rot: number) {
      const x = Math.cos(lat) * Math.sin(lng + rot);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lng + rot);
      return {
        x: centerX + x * radius,
        y: centerY - y * radius,
        z,
      };
    }

    function drawArc(
      ctx: CanvasRenderingContext2D,
      from: { lat: number; lng: number },
      to: { lat: number; lng: number },
      rot: number,
      time: number
    ) {
      const steps = 30;
      const points: { x: number; y: number; z: number }[] = [];

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = from.lat + (to.lat - from.lat) * t;
        const lng = from.lng + (to.lng - from.lng) * t;
        const arcHeight = Math.sin(t * Math.PI) * 0.15;
        const p = project(lat + arcHeight, lng, rot);
        points.push(p);
      }

      const visiblePoints = points.filter((p) => p.z > -0.1);
      if (visiblePoints.length < 2) return;

      const pulsePos = (time * 0.5) % 1;
      const pulseIdx = Math.floor(pulsePos * points.length);

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < points.length; i++) {
        if (points[i].z > -0.1) {
          const alpha = 0.15 + points[i].z * 0.25;
          ctx.strokeStyle = `rgba(100, 100, 100, ${alpha})`;
          if (!started) {
            ctx.moveTo(points[i].x, points[i].y);
            started = true;
          } else {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
      }
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();

      if (pulseIdx < points.length && points[pulseIdx].z > 0) {
        ctx.beginPath();
        ctx.arc(points[pulseIdx].x, points[pulseIdx].y, 3 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30, 30, 30, ${0.6 + points[pulseIdx].z * 0.4})`;
        ctx.fill();
      }
    }

    function draw(time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      // Outer glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.9,
        centerX, centerY, radius * 1.3
      );
      gradient.addColorStop(0, 'rgba(200, 200, 200, 0.08)');
      gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Globe outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180, 180, 180, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Globe fill
      const globeGradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, 0,
        centerX, centerY, radius
      );
      globeGradient.addColorStop(0, 'rgba(250, 250, 250, 0.6)');
      globeGradient.addColorStop(1, 'rgba(230, 230, 230, 0.2)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = globeGradient;
      ctx.fill();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 3) {
          const lngRad = (lng * Math.PI) / 180;
          const p = project(latRad, lngRad, rotation);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(180, 180, 180, 0.15)';
        ctx.lineWidth = 0.5 * scale;
        ctx.stroke();
      }

      // Longitude lines
      for (let lng = -180; lng < 180; lng += 30) {
        const lngRad = (lng * Math.PI) / 180;
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const latRad = (lat * Math.PI) / 180;
          const p = project(latRad, lngRad, rotation);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(180, 180, 180, 0.15)';
        ctx.lineWidth = 0.5 * scale;
        ctx.stroke();
      }

      // Dot grid
      for (const dot of dots) {
        const p = project(dot.lat, dot.lng, rotation);
        if (p.z > 0) {
          const alpha = 0.1 + p.z * 0.35;
          const dotSize = (1 + p.z * 0.8) * scale;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80, 80, 80, ${alpha})`;
          ctx.fill();
        }
      }

      // Connection arcs
      const t = time * 0.001;
      for (let i = 0; i < arcs.length; i++) {
        drawArc(ctx, arcs[i].from, arcs[i].to, rotation, t + i * 0.2);
      }

      // Key location markers
      const locations = [
        { lat: 40, lng: -74 },
        { lat: 51, lng: 0 },
        { lat: -1, lng: 36 },
        { lat: 35, lng: 139 },
        { lat: -33, lng: 151 },
        { lat: -23, lng: -46 },
      ];

      for (const loc of locations) {
        const p = project(
          (loc.lat * Math.PI) / 180,
          (loc.lng * Math.PI) / 180,
          rotation
        );
        if (p.z > 0.1) {
          const pulseRadius = (4 + Math.sin(time * 0.003) * 2) * scale;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(50, 50, 50, ${0.15 + p.z * 0.15})`;
          ctx.lineWidth = 1 * scale;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(30, 30, 30, ${0.5 + p.z * 0.5})`;
          ctx.fill();
        }
      }

      rotation += 0.003;
      animationRef.current = requestAnimationFrame(draw);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    setupCanvas();

    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvas]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default RotatingGlobe;
