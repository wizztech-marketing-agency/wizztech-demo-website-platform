import React, { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

export const IframeAuthCheck: React.FC = () => {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuthenticated = !!session;
        
        // Post message back to parent window
        window.parent.postMessage({
          type: 'WIZZTECH_AUTH_RESULT',
          isAuthenticated
        }, '*');
      } catch (error) {
        console.error('Iframe auth check error:', error);
        window.parent.postMessage({
          type: 'WIZZTECH_AUTH_RESULT',
          isAuthenticated: false
        }, '*');
      }
    };

    // Listen for ping message in case parent requests check again
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'WIZZTECH_AUTH_PING') {
        checkAuth();
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Perform initial check immediately on load
    checkAuth();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return null; // Render nothing as it is loaded inside a hidden iframe
};
