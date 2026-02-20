import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { addActivity } from "@/lib/firebaseServices";

const getDevice = (): string => {
  const ua = navigator.userAgent;
  let os = "Unknown";
  let browser = "Unknown";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "Mac";
  else if (/Linux/i.test(ua)) os = "Linux";

  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";

  return `${os} - ${browser}`;
};

export const useActivityTracker = () => {
  const { user } = useAuth();
  const location = useLocation();
  const lastPage = useRef("");

  const trackActivity = useCallback(
    (action: string, details: string) => {
      if (!user) return;
      addActivity({
        userId: user.uid,
        userName: user.displayName || user.email || "Unknown",
        userPhone: (user as any).phoneNumber || "",
        action,
        details,
        page: location.pathname,
        timestamp: new Date().toISOString(),
        ip: "",
        device: getDevice(),
      } as any).catch(() => {});
    },
    [user, location.pathname]
  );

  // Track page navigation
  useEffect(() => {
    if (!user) return;
    if (location.pathname === lastPage.current) return;
    lastPage.current = location.pathname;
    trackActivity("navigate", `Navigated to ${location.pathname}`);
  }, [location.pathname, user, trackActivity]);

  // Track clicks on the document
  useEffect(() => {
    if (!user) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      const button = target.closest("button");
      const card = target.closest("[data-track]");

      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        const text = anchor.textContent?.trim().slice(0, 60) || href;
        trackActivity("click", `Clicked link: ${text}`);
      } else if (button) {
        const text = button.textContent?.trim().slice(0, 60) || "button";
        // Skip tracking minor UI buttons
        if (text.length > 1) {
          trackActivity("click", `Clicked: ${text}`);
        }
      } else if (card) {
        const title = card.getAttribute("data-track") || "content";
        trackActivity("click", `Viewed: ${title}`);
      }
    };

    // Use capture to get all clicks
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [user, trackActivity]);

  return { trackActivity };
};
