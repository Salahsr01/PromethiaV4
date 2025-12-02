"use client"

import React from 'react'

function Dimensions() {
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const resize = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: 10,
      left: 10,
      background: "#eee",
      padding: "4px 8px",
      borderRadius: "4px"
    }}>
      Largeur : {dimensions.width}px<br />
      Hauteur : {dimensions.height}px
    </div>
  );
}

export default Dimensions
