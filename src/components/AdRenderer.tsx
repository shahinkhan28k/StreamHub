import React, { useEffect, useRef } from 'react';

interface AdRendererProps {
  htmlCode?: string;
  className?: string;
}

export default function AdRenderer({ htmlCode, className = "" }: AdRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!htmlCode || !containerRef.current) return;

    // Clear old elements
    containerRef.current.innerHTML = '';

    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlCode;

    // Process nodes and script tags
    const nodes = Array.from(tempDiv.childNodes);
    
    nodes.forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        // Copy attributes
        Array.from((node as HTMLScriptElement).attributes).forEach(attr => {
          script.setAttribute(attr.name, attr.value);
        });
        // Copy inline script content
        script.innerHTML = (node as HTMLScriptElement).innerHTML;
        containerRef.current.appendChild(script);
      } else {
        containerRef.current.appendChild(node.cloneNode(true));
      }
    });
  }, [htmlCode]);

  if (!htmlCode) return null;

  return (
    <div 
      ref={containerRef} 
      className={`w-full flex justify-center items-center overflow-hidden bg-neutral-900/10 border border-white/5 rounded-2xl p-4 my-6 ${className}`}
    />
  );
}
