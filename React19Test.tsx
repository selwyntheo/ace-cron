import React from 'react';

// Simple test component to verify React 19 features
const React19Test: React.FC = () => {
  console.log('React version:', React.version);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '8px 12px', 
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999 
    }}>
      React {React.version}
    </div>
  );
};

export default React19Test;
