"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { GraduationCap } from "lucide-react";

const Gradient = lazy(() => import("@shadergradient/react").then(({ ShaderGradient, ShaderGradientCanvas }) => ({
  default: function AcademyGradient() {
    return (
      <ShaderGradientCanvas
        style={{ position: "absolute", inset: 0 }}
        pixelDensity={1}
        powerPreference="low-power"
        fov={45}
      >
        <ShaderGradient
          control="props"
          type="plane"
          animate="off"
          cameraZoom={1}
          cDistance={4}
          cPolarAngle={95}
          color1="#2d1b15"
          color2="#a65531"
          color3="#e5a475"
          grain="off"
          lightType="3d"
          uStrength={1.4}
        />
      </ShaderGradientCanvas>
    );
  },
})));

class GradientFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function AcademyArtwork() {
  const stage = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(false);

  useEffect(() => {
    const element = stage.current;
    if (!element || !window.WebGL2RenderingContext || typeof IntersectionObserver === "undefined") return;
    const eligible = window.matchMedia("(min-width: 801px) and (prefers-reduced-motion: no-preference)");
    const observer = new IntersectionObserver(([entry]) => {
      setShowGradient(entry.isIntersecting && eligible.matches);
    });
    const reset = () => {
      observer.disconnect();
      setShowGradient(false);
      observer.observe(element);
    };
    observer.observe(element);
    eligible.addEventListener("change", reset);
    return () => { observer.disconnect(); eligible.removeEventListener("change", reset); };
  }, []);

  return (
    <div className="rev-academy-art" ref={stage} aria-hidden="true">
      {showGradient && <GradientFallback><Suspense fallback={null}><Gradient /></Suspense></GradientFallback>}
      <GraduationCap size={100} strokeWidth={.8} />
    </div>
  );
}
