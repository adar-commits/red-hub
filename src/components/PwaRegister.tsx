"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const url = new URL(window.location.origin);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (reg.installing) reg.installing.addEventListener("statechange", () => {});
      })
      .catch(() => {});
  }, []);

  return null;
}
