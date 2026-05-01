import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 0,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  scrollOffset = 0.1, // Percentage of viewport to offset start
  delay = 0 // Stagger delay
}) => {
  const containerRef = useRef(null);
  const isString = typeof children === 'string';

  const splitText = useMemo(() => {
    if (!isString) return null;
    return children.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children, isString]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Detect mobile and disable reveal for better UX/Performance on small screens
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      gsap.set(el, { opacity: 1, rotate: 0, filter: 'none' });
      const targets = isString ? el.querySelectorAll('.word') : el.children;
      if (targets.length > 0) {
        gsap.set(targets, { opacity: 1, filter: 'none', y: 0 });
      }
      return;
    }

    // On public pages, window is always the scroller (container has no fixed height/overflow)
    const isPublicShell = !!document.querySelector('.app-shell.public-shell');
    const containerEl = document.querySelector('.container');
    const containerIsScrollable = !isPublicShell && containerEl
      ? ['auto', 'scroll'].includes(getComputedStyle(containerEl).overflowY)
      : false;
    const scroller = (scrollContainerRef && scrollContainerRef.current)
      ? scrollContainerRef.current
      : (containerIsScrollable ? containerEl : window);

    // Animation target: either the words (if string) or the children container itself
    const targets = isString ? el.querySelectorAll('.word') : el.children;

    // 1. Rotation Reveal
    gsap.fromTo(
      el,
      { transformOrigin: '50% 50%', rotate: baseRotation, opacity: baseOpacity },
      {
        ease: 'power2.out',
        rotate: 0,
        opacity: 1,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: `top bottom-=${scrollOffset * 100}%`,
          toggleActions: 'play none none none'
        }
      }
    );

    // 2. Word/Child Staggered Fade & Blur
    if (targets.length > 0) {
      gsap.fromTo(
        targets,
        {
          opacity: isString ? baseOpacity : 0,
          filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
          y: isString ? 0 : 20
        },
        {
          ease: 'power2.out',
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          delay: delay,
          stagger: isString ? 0.05 : 0.1,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: `top bottom-=${(scrollOffset + 0.1) * 100}%`,
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // Refresh after layout settles to get correct positions
    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      cancelAnimationFrame(rafId);
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength, isString, scrollOffset]);

  return (
    <div 
      ref={containerRef} 
      className={`scroll-reveal ${isString ? 'scroll-reveal--text-mode' : ''} ${containerClassName}`}
    >
      {isString ? (
        <p className={`scroll-reveal-text ${textClassName}`}>{splitText}</p>
      ) : (
        children
      )}
    </div>
  );
};

export default ScrollReveal;
