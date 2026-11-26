"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import type { LiquidMetal } from "@paper-design/shaders-react";

export function FlameMark() {
  const stage = useRef<HTMLDivElement>(null);
  const [Shader, setShader] = useState<ComponentType<React.ComponentProps<typeof LiquidMetal>> | null>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (!window.WebGL2RenderingContext) return;
      const probe = document.createElement("canvas").getContext("webgl2");
      if (!probe) return;
      probe.getExtension("WEBGL_lose_context")?.loseContext();
      void import("@paper-design/shaders-react").then((module) => {
        if (active) setShader(() => module.LiquidMetal);
      }).catch(() => {/* The original mark is already visible. */});
    });
    observer.observe(element);
    return () => { active = false; observer.disconnect(); };
  }, []);

  return (
    <div className="rev-flame-stage" ref={stage}>
      <img src="/revival-flame.png" alt="" loading="lazy" width="320" height="320" />
      {Shader && <Shader
        className="rev-flame-shader"
        style={{ width: "100%", height: "100%" }}
        image="/revival-flame.png"
        colorBack="#301b1500"
        colorTint="#e9a281"
        fit="contain"
        scale={.76}
        speed={0}
        frame={28}
        minPixelRatio={1}
      />}
    </div>
  );
}
