'use client'
import React, { useState, useEffect } from 'react';
import { getTokenDebugInfo } from '@/lib/auth-service';
import { useAuthStore } from '@/store/auth.store';

interface TokenInfo {
  valid: boolean;
  isExpired: boolean;
  userId: string;
  issuedAt: string;
  expiresAt: string;
  timeLeft: string;
}

interface ApiTestState {
  status?: number;
  data?: any;
  error?: string;
}

const AuthDebugger = () => {
  const { token } = useAuthStore();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [apiTest, setApiTest] = useState<ApiTestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    if (token) {
      const info = getTokenDebugInfo(token);
      setTokenInfo(info);
    } else {
      setTokenInfo(null);
    }
  }, [token]);

  const testAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      setApiTest({
        status: response.status,
        data
      });
    } catch (error) {
      setApiTest({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showDebugger) {
    return (
      <button 
        onClick={() => setShowDebugger(true)} 
        className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded shadow-lg"
      >
        Debug Auth
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Auth Debugger</h2>
        <button 
          onClick={() => setShowDebugger(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      <div className="mb-4">
        <h3 className="font-medium text-gray-700 mb-2">Token Status</h3>
        <div className="bg-gray-50 p-3 rounded border text-sm">
          {token ? (
            <div>
              <div className="flex justify-between">
                <span>Token Present:</span>
                <span className="font-medium text-green-600">Yes</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Valid:</span>
                <span className={`font-medium ${tokenInfo?.valid ? 'text-green-600' : 'text-red-600'}`}>
                  {tokenInfo?.valid ? 'Yes' : 'No'}
                </span>
              </div>
              {tokenInfo?.isExpired && (
                <div className="mt-1 text-red-600">
                  Token is expired! Please log in again.
                </div>
              )}
              {tokenInfo && (
                <>
                  <div className="mt-2">
                    <div><strong>User ID:</strong> {tokenInfo.userId}</div>
                    <div><strong>Issued:</strong> {tokenInfo.issuedAt}</div>
                    <div><strong>Expires:</strong> {tokenInfo.expiresAt}</div>
                    <div><strong>Time Left:</strong> {tokenInfo.timeLeft}</div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-red-600">No token found</div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium text-gray-700 mb-2">Test API Connection</h3>
        <button 
          onClick={testAuth} 
          disabled={isLoading || !token}
          className={`w-full py-2 px-4 rounded ${!token ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {isLoading ? 'Testing...' : 'Test Auth API'}
        </button>
        
        {apiTest && (
          <div className="mt-2 bg-gray-50 p-3 rounded border text-sm">
            {apiTest.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {apiTest.error}
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${apiTest.status === 200 ? 'text-green-600' : 'text-red-600'}`}>
                    {apiTest.status}
                  </span>
                </div>
                <div className="mt-2">
                  <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                    {JSON.stringify(apiTest.data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-700 mb-2">Authentication Headers</h3>
        <div className="bg-gray-50 p-3 rounded border text-sm font-mono ">
          <div className="mb-1">Authorization: Bearer {token ? `${token.substring(0, 15)}...` : 'null'}</div>
          <div className="text-xs text-gray-500 mt-2">
            This header will be sent with all API requests
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        This debugging panel is for development only. Remove in production.
      </div>
    </div>
  );
};

export default AuthDebugger;