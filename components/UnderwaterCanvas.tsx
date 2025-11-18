import React, { useRef, useEffect } from 'react';
import { ParticleType } from '../types';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
}

interface ParticleOverlayProps {
    type: ParticleType;
}

const ParticleOverlay: React.FC<ParticleOverlayProps> = ({ type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || type === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = type === 'rain' ? 400 : type === 'space' ? 100 : 150;

    // Helper to get particle traits based on type
    const createParticle = (w: number, h: number, initial = false): Particle => {
        const p: any = {
            x: Math.random() * w,
            y: initial ? Math.random() * h : (type === 'bubbles' || type === 'embers' ? h + 10 : -10),
        };

        switch(type) {
            case 'rain':
                p.size = Math.random() * 20 + 10; // Length
                p.speedY = Math.random() * 15 + 20;
                p.speedX = -2; // Slant
                p.opacity = Math.random() * 0.3 + 0.1;
                p.color = 'rgba(200, 200, 255,';
                break;
            case 'snow':
                p.size = Math.random() * 3 + 1;
                p.speedY = Math.random() * 2 + 1;
                p.speedX = Math.random() * 2 - 1;
                p.opacity = Math.random() * 0.8 + 0.2;
                p.color = 'rgba(255, 255, 255,';
                break;
            case 'embers':
                p.size = Math.random() * 3 + 1;
                p.speedY = -(Math.random() * 2 + 1);
                p.speedX = Math.random() * 1 - 0.5;
                p.opacity = Math.random();
                p.color = 'rgba(255, 100, 50,';
                break;
            case 'bubbles':
                p.size = Math.random() * 4 + 1;
                p.speedY = -(Math.random() * 1.5 + 0.5);
                p.speedX = Math.random() * 0.5 - 0.25;
                p.opacity = Math.random() * 0.5 + 0.1;
                p.color = 'rgba(200, 230, 255,';
                break;
            case 'space':
                 p.size = Math.random() * 2;
                 p.speedY = 0;
                 p.speedX = 0;
                 p.opacity = Math.random();
                 p.color = 'rgba(255, 255, 255,';
                 break;
            case 'dust':
            default:
                p.size = Math.random() * 2;
                p.speedY = Math.random() * 0.5 - 0.25;
                p.speedX = Math.random() * 0.5 - 0.25;
                p.opacity = Math.random() * 0.4 + 0.1;
                p.color = 'rgba(200, 200, 200,';
                break;
        }
        // If default or generic
        if (!p.color) p.color = 'rgba(255, 255, 255,';
        
        return p as Particle;
    }

    // Initialize
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(width, height, true));
    }

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Render Particles
      particles.forEach((p, i) => {
        // Movement
        p.y += p.speedY;
        p.x += p.speedX;

        // Sway for bubbles/snow
        if (type === 'bubbles' || type === 'snow') {
             p.x += Math.sin(time + p.y * 0.01) * 0.5;
        }

        // Reset Check
        const isOutOfBounds = 
            (p.speedY > 0 && p.y > height) || 
            (p.speedY < 0 && p.y < -20) ||
            (p.x > width + 20 || p.x < -20);

        if (isOutOfBounds && type !== 'space') {
          particles[i] = createParticle(width, height);
        }
        
        if (type === 'space') {
             // Twinkle
             p.opacity = 0.5 + Math.sin(time * 5 + i) * 0.5;
        }

        // Draw
        ctx.beginPath();
        if (type === 'rain') {
            ctx.lineWidth = 1;
            ctx.strokeStyle = `${p.color} ${p.opacity})`;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.speedX * 2, p.y + p.size);
            ctx.stroke();
        } else {
            ctx.fillStyle = `${p.color} ${p.opacity})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      // Vignette / Overlay based on type
      if (type === 'underwater' || type === 'bubbles') {
           // keep blueish tint
           ctx.fillStyle = 'rgba(0, 20, 30, 0.1)'; 
           ctx.fillRect(0,0,width,height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type]);

  if (type === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 mix-blend-screen"
    />
  );
};

export default ParticleOverlay;