'use client';

import React, { type ReactNode } from 'react';

type AOSAnimation =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'fade-up-right'
  | 'fade-up-left'
  | 'zoom-in'
  | 'zoom-in-up'
  | 'zoom-out'
  | 'flip-up'
  | 'flip-left'
  | 'flip-right'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right';

interface AOSProps {
  children: ReactNode;
  animation?: AOSAnimation;
  duration?: number;
  delay?: number;
  offset?: number;
  easing?: string;
  /** render as a different tag (default: div) */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

/**
 * AOS — thin wrapper that adds data-aos-* attributes to a container element.
 * Compatible with both Server and Client components (attributes are inert HTML).
 */
export function AOS({
  children,
  animation = 'fade-up',
  duration = 600,
  delay = 0,
  offset = 60,
  easing = 'ease-out-cubic',
  as: Tag = 'div',
  className,
}: AOSProps) {
  return (
    <Tag
      data-aos={animation}
      data-aos-duration={duration}
      data-aos-delay={delay}
      data-aos-offset={offset}
      data-aos-easing={easing}
      className={className}
    >
      {children}
    </Tag>
  );
}
