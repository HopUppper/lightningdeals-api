import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface CredTiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  tiltAngle?: number;
  elevateOnHover?: boolean;
  borderBeam?: boolean;
  onClick?: () => void;
}

export const CredTiltCard: React.FC<CredTiltCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(109, 40, 217, 0.16)', // Deep luxury plum
  tiltAngle = 10,
  elevateOnHover = true,
  borderBeam = false,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coordinate relative to card center (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for high-end haptic feel (CRED signature damping)
  const springConfig = { damping: 22, stiffness: 260, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [tiltAngle, -tiltAngle]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-tiltAngle, tiltAngle]), springConfig);

  // Spotlight coordinates (in pixels)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    mouseX.set(currentX);
    mouseY.set(currentY);

    // Normalize (-0.5 to 0.5)
    x.set(currentX / width - 0.5);
    y.set(currentY / height - 0.5);
  }, [mouseX, mouseY, x, y, prefersReducedMotion]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="relative w-full h-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={elevateOnHover && !prefersReducedMotion ? { y: -5, scale: 1.008 } : undefined}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`relative overflow-hidden transition-shadow duration-300 ${className}`}
      >
        {/* Animated CRED Border Beam */}
        {borderBeam && (
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none p-[1.5px] overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="absolute -inset-[150%] animate-cred-beam opacity-70"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0 320deg, #6d28d9 350deg, #c084fc 360deg)',
              }}
            />
          </div>
        )}

        {/* Dynamic Holographic Cursor Spotlight Glow */}
        {!prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 z-10"
            style={{
              opacity: isHovered ? 1 : 0,
              background: useTransform(
                [mouseX, mouseY],
                ([latestX, latestY]) =>
                  `radial-gradient(450px circle at ${latestX}px ${latestY}px, ${glowColor}, transparent 70%)`
              ),
            }}
            aria-hidden="true"
          />
        )}

        {/* Card Content Layer */}
        <div className="relative z-20 w-full h-full max-w-full overflow-hidden">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
