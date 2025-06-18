import React from 'react';

const Image = ({ src, alt, width, height, className, ...props }: any) => {
  // For testing, we can just return a regular img tag
  // The src will be the original path, not the Next.js optimized path
  return <img src={src} alt={alt} width={width} height={height} className={className} {...props} />;
};

export default Image;
