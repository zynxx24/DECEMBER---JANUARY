import React, { useState } from "react";
import dynamic from "next/dynamic";
import loadingAnimation from "./Animation - 1735275597228.json"; // Import the animation JSON file

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const SmartImage = ({
  src = "",
  alt = "Image",
  placeholders = (
    <div style={{ width: "100px", height: "100px", margin: "auto" }}>
      <Lottie animationData={loadingAnimation} loop={true} />
    </div>
  ),
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return <div>Failed to load image</div>;
  }

  return (
    <span style={{ display: "inline-block", position: "relative" }}>
      {/* Show the placeholders while the image is loading */}
      {!loaded && placeholders}

      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          visibility: loaded ? "visible" : "hidden",
          transition: "visibility 0.5s ease-in-out",
          position: "relative",
          zIndex: loaded ? 1 : -1, // Ensure image appears above loader
        }}
      />
    </span>
  );
};

export default SmartImage;
