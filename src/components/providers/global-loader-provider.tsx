"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface GlobalLoaderContextValue {
  start: (label?: string) => void;
  stop: (label?: string) => void;
  withLoader: <T>(operation: (() => Promise<T>) | Promise<T>) => Promise<T>;
  isVisible: boolean;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | null>(null);

const MIN_VISIBLE_PROGRESS = 12;
const MAX_IDLE_PROGRESS = 90;
const INTERACTION_SETTLE_DELAY = 500;
const NAVIGATION_TIMEOUT = 2000;
const FORM_SUBMIT_TIMEOUT = 5000;

export const GlobalLoaderProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchSignature = searchParams?.toString();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const activeCounter = useRef(0);
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNavigationRef = useRef(false);
  const fetchCounterRef = useRef(0);
  const lastPathnameRef = useRef(pathname);

  const clearCompletionTimeout = () => {
    if (completionTimeout.current) {
      clearTimeout(completionTimeout.current);
      completionTimeout.current = null;
    }
  };

  const start = useCallback(() => {
    activeCounter.current += 1;
    clearCompletionTimeout();
    // Defer state updates to avoid useInsertionEffect warning
    setTimeout(() => {
      setIsVisible(true);
      setProgress((current) => (current === 0 ? MIN_VISIBLE_PROGRESS : current));
    }, 0);
  }, []);

  const finish = useCallback(() => {
    clearCompletionTimeout();
    // Defer state updates to avoid useInsertionEffect warning
    setTimeout(() => {
      setProgress(100);
      completionTimeout.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
    }, 0);
  }, []);

  const stop = useCallback(() => {
    activeCounter.current = Math.max(0, activeCounter.current - 1);
    if (activeCounter.current === 0 && fetchCounterRef.current === 0) {
      finish();
    }
  }, [finish]);

  const forceStop = useCallback(() => {
    activeCounter.current = 0;
    fetchCounterRef.current = 0;
    pendingNavigationRef.current = false;
    clearCompletionTimeout();
    if (interactionTimeout.current) {
      clearTimeout(interactionTimeout.current);
      interactionTimeout.current = null;
    }
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    finish();
  }, [finish]);

  const cancelInteractionStop = useCallback(() => {
    if (interactionTimeout.current) {
      clearTimeout(interactionTimeout.current);
      interactionTimeout.current = null;
    }
  }, []);

  const scheduleInteractionStop = useCallback(() => {
    cancelInteractionStop();
    interactionTimeout.current = setTimeout(() => {
      stop();
      interactionTimeout.current = null;
    }, INTERACTION_SETTLE_DELAY);
  }, [cancelInteractionStop, stop]);

  const clearNavigationTimeout = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  const beginNavigation = useCallback(() => {
    cancelInteractionStop();
    pendingNavigationRef.current = true;
    clearNavigationTimeout();
    start();
    navigationTimeoutRef.current = setTimeout(() => {
      if (pendingNavigationRef.current) {
        // Check if we're actually stuck or just slow
        if (fetchCounterRef.current > 0) {
          // Still fetching, this is normal - extend timeout
          console.log("Navigation in progress with active fetches, extending timeout...");
          navigationTimeoutRef.current = setTimeout(() => {
            if (pendingNavigationRef.current) {
              console.warn("Extended navigation timeout reached, forcing stop");
              forceStop();
            }
          }, NAVIGATION_TIMEOUT);
        } else {
          // No fetches but still pending - likely stuck
          console.warn("Navigation completed but loader stuck, forcing stop");
          forceStop();
        }
      }
    }, NAVIGATION_TIMEOUT);
  }, [cancelInteractionStop, clearNavigationTimeout, start, forceStop]);

  useEffect(() => {
    if (!isVisible) return undefined;
    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= MAX_IDLE_PROGRESS) return current;
        const delta = Math.random() * 10;
        return Math.min(current + delta, MAX_IDLE_PROGRESS);
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    const currentPath = pathname + (searchSignature || "");
    const previousPath = lastPathnameRef.current + (searchSignature || "");

    if (currentPath !== previousPath) {
      lastPathnameRef.current = pathname;

      if (pendingNavigationRef.current) {
        pendingNavigationRef.current = false;
        clearNavigationTimeout();

        // Wait briefly for any fetches to start
        setTimeout(() => {
          // If no fetches started, the page came from cache - stop immediately
          if (fetchCounterRef.current === 0) {
            forceStop();
          }
          // If fetches are active, let the fetch interceptor handle completion
        }, 200); // Increased to 200ms for better fetch detection
      }
    }
  }, [pathname, searchSignature, clearNavigationTimeout, forceStop]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      beginNavigation();
    };

    const wrapHistoryMethod = (method: "pushState" | "replaceState") => {
      const original = window.history[method];
      const patched = (...args: Parameters<typeof original>) => {
        beginNavigation();
        return original.apply(window.history, args);
      };
      window.history[method] = patched as typeof original;
      return () => {
        window.history[method] = original;
      };
    };

    const restorePush = wrapHistoryMethod("pushState");
    const restoreReplace = wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", handlePopState);

    return () => {
      restorePush();
      restoreReplace();
      window.removeEventListener("popstate", handlePopState);
    };
  }, [beginNavigation]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (...args) => {
      fetchCounterRef.current += 1;

      // Only start loader if not already visible (avoid duplicate starts)
      if (!isVisible) {
        start();
      }

      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        fetchCounterRef.current = Math.max(0, fetchCounterRef.current - 1);

        // Stop when this is the last fetch and there are active operations
        if (fetchCounterRef.current === 0 && activeCounter.current > 0) {
          // Small delay to handle rapid successive fetches
          setTimeout(() => {
            if (fetchCounterRef.current === 0) {
              stop();
            }
          }, 50);
        }
      }
    }) as typeof fetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [start, stop, isVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const interactiveSelectors = [
      "button:not([type=submit])",
      "[type=button]",
      "a[href]",
      "[role=button]",
      "[data-loader-trigger]",
    ].join(",");
  const navigationSelectors = ["a[href]", "[data-loader-navigation]"].join(",");

    const handlePointer = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Check if inside a form - let form submit handler deal with it
      const form = target.closest("form");
      if (form) return;

      const actionable = target.closest(interactiveSelectors);
      if (!actionable) return;

      // Skip if button has data-loader-skip attribute
      if (actionable.hasAttribute("data-loader-skip")) return;

      const isNavigation = actionable.matches(navigationSelectors);
      if (isNavigation) {
        beginNavigation();
      } else {
        start();
        scheduleInteractionStop();
      }
    };

    document.addEventListener("pointerdown", handlePointer, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointer, true);
    };
  }, [beginNavigation, scheduleInteractionStop, start]);

  // Handle form submissions
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (!form) return;

      start();

      // Set a timeout to force stop if form submission takes too long
      const submitTimeout = setTimeout(() => {
        console.warn("Form submission timeout reached, forcing loader stop");
        forceStop();
      }, FORM_SUBMIT_TIMEOUT);

      // Monitor fetch completion
      const checkInterval = setInterval(() => {
        if (fetchCounterRef.current === 0 && activeCounter.current > 0) {
          clearTimeout(submitTimeout);
          clearInterval(checkInterval);
          stop();
        }
      }, 100);

      // Cleanup after max timeout
      setTimeout(() => {
        clearInterval(checkInterval);
      }, FORM_SUBMIT_TIMEOUT);
    };

    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, [start, stop, forceStop]);

  // Handle select/input changes
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const changeSelectors = [
      "select[data-loader-trigger]",
      "input[data-loader-trigger]",
      "[data-loader-change]"
    ].join(",");

    const handleChange = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const actionable = target.closest(changeSelectors);
      if (!actionable) return;

      start();
      scheduleInteractionStop();
    };

    document.addEventListener("change", handleChange, true);
    return () => document.removeEventListener("change", handleChange, true);
  }, [scheduleInteractionStop, start]);

  const withLoader = useCallback(async <T,>(operation: (() => Promise<T>) | Promise<T>) => {
    start();
    try {
      const attempt = typeof operation === "function" ? (operation as () => Promise<T>)() : operation;
      const result = await attempt;
      return result;
    } finally {
      stop();
    }
  }, [start, stop]);

  const value = useMemo<GlobalLoaderContextValue>(
    () => ({
      start,
      stop,
      withLoader,
      isVisible,
    }),
    [isVisible, start, stop, withLoader],
  );

  return (
    <GlobalLoaderContext.Provider value={value}>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-1">
        <div
          className="h-full w-0 origin-left bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg transition-[width,opacity] duration-300 ease-out"
          style={{
            width: `${progress}%`,
            opacity: isVisible ? 1 : 0,
          }}
        />
      </div>
      {children}
    </GlobalLoaderContext.Provider>
  );
};

export const useGlobalLoader = () => {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used within a GlobalLoaderProvider");
  }
  return context;
};
