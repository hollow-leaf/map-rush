import React, { useState, useRef, useEffect } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
  size?: number;
  stickSize?: number;
  baseColor?: string;
  stickColor?: string;
}

const Joystick: React.FC<JoystickProps> = ({
  onMove,
  onEnd,
  size = 100,
  stickSize = 50,
  baseColor = 'rgba(0, 0, 0, 0.3)',
  stickColor = 'rgba(0, 0, 0, 0.6)',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);

  const handleInteractionStart = (event: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    // No need to move stick on start, it will be calculated in handleInteractionMove
  };

  const handleInteractionMove = (event: MouseEvent | TouchEvent) => {
    if (!isDragging || !baseRef.current) return;

    event.preventDefault(); // Prevent page scrolling

    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const maxDistance = (size - stickSize) / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    setPosition({ x: dx, y: dy });
    onMove(dx / maxDistance, -dy / maxDistance); // Normalize and invert Y
  };

  const handleInteractionEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onEnd();
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleInteractionMove);
      window.addEventListener('touchmove', handleInteractionMove, { passive: false });
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchend', handleInteractionEnd);
    } else {
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging]);

  const baseStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: baseColor,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // For stick positioning
    touchAction: 'none', // Disable default touch actions like scrolling
    userSelect: 'none', // Disable text selection
  };

  const stickStyle: React.CSSProperties = {
    width: `${stickSize}px`,
    height: `${stickSize}px`,
    borderRadius: '50%',
    backgroundColor: stickColor,
    position: 'absolute',
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={baseRef}
      style={baseStyle}
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
    >
      <div style={stickStyle} />
    </div>
  );
};

export default Joystick;
