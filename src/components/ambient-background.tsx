"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-midnight-navy via-[#111d3a] to-[#1a103d]" />

      <div className="absolute inset-0 ambient-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <motion.div
        aria-hidden
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-electric-violet/30 blur-[120px]"
        animate={{
          x: [0, 60, -30, 0],
          y: [0, 40, -30, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        aria-hidden
        className="absolute -bottom-40 -right-32 h-[640px] w-[640px] rounded-full bg-soft-lavender/15 blur-[140px]"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, -30, 40, 0],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        aria-hidden
        className="absolute top-1/3 right-1/4 h-[280px] w-[280px] rounded-full bg-[#5b21b6]/30 blur-[120px]"
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(15,23,42,0.6)_70%)]" />
    </div>
  );
}
