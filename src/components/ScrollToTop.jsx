import React from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace(/^#/, "");
      const scrollToHashTarget = () => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({
            block: "start",
            behavior: "instant",
          });
          return true;
        }
        return false;
      };

      if (scrollToHashTarget()) return;

      let attempts = 0;
      const maxAttempts = 20;
      const intervalId = window.setInterval(() => {
        attempts += 1;
        const found = scrollToHashTarget();
        if (found || attempts >= maxAttempts) {
          window.clearInterval(intervalId);
        }
      }, 100);

      return () => window.clearInterval(intervalId);
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" // prevents smooth lag
    });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
