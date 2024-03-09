import React, { useEffect, useRef } from "react";
import { useColorMode } from "@docusaurus/theme-common";
const utterancesSelector = "iframe.utterances-frame";

export default function Utterance() {
  const containerRef = useRef(null);

  const { isDarkTheme } = useColorMode();
  const utterancesTheme = isDarkTheme ? "github-dark" : "github-light";

  useEffect(() => {
    const utterancesEl = containerRef.current.querySelector(utterancesSelector);
    const createUtterancesEl = () => {
      const script = document.createElement("script");

      script.src = "https://utteranc.es/client.js";
      script.setAttribute("repo", "BCSD/blog");
      script.setAttribute("issue-term", "pathname");
      script.setAttribute("label", "comment");
      script.setAttribute("theme", utterancesTheme);
      script.crossOrigin = "anonymous";
      script.async = true;

      containerRef.current.appendChild(script);
    };
    const postThemeMessage = () => {
      const message = {
        type: "set-theme",
        theme: utterancesTheme,
      };

      utterancesEl.contentWindow.postMessage(message, "https://utteranc.es");
    };

    utterancesEl ? postThemeMessage() : createUtterancesEl();
  }, [utterancesTheme]);

  return <div ref={containerRef} />;
}
