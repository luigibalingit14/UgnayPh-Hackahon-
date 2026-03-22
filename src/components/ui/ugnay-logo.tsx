"use client";

import React from "react";
import Image from "next/image";

export function UgnayLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <Image
      src="/image-removebg-preview.png"
      alt="UgnayPH Logo"
      width={80}
      height={80}
      className={className}
      priority
    />
  );
}
