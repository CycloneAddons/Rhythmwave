import React, { useState, useEffect, createContext } from "react";
import PropTypes from "prop-types";

import "./Loading.css";

export const AppContext = createContext();

export const Loading = ({ children }) => {
  const [loadingText, setLoadingText] = useState("Loading");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev === "Loading") return "Loading.";
        if (prev === "Loading.") return "Loading..";
        if (prev === "Loading..") return "Loading...";
        return "Loading";
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{ setIsLoading }}>
      {isLoading && (
        <div className="loader-container" role="alert" aria-live="polite">
          <div className="loader">
            <p>{loadingText}</p>
          </div>
        </div>
      )}
      <div className={isLoading ? "blur-background" : ""}>{children}</div>
    </AppContext.Provider>
  );
};

Loading.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Loading;
