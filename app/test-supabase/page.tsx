"use client";

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, supabaseConfig } from '@/lib/supabase/config';

export default function TestSupabasePage() {
  const [status, setStatus] = useState('Checking...');
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    const test = async () => {
      setConfig(supabaseConfig);

      if (isSupabaseConfigured()) {
        setStatus('✅ Supabase environment variables are set! Testing connection...');
        
        try {
          // Test the connection
          const { data, error } = await supabase.from('users').select('count').limit(1);
          
          if (error) {
            setStatus(`❌ Connection error: ${error.message}`);
          } else {
            setStatus('✅ Connected to Supabase successfully!');
          }
        } catch (e: any) {
          setStatus(`❌ Error: ${e.message}`);
        }
      } else {
        setStatus('⚠️ Supabase environment variables are missing. Please check your .env file.');
      }
    };

    test();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className={`p-4 rounded-lg mb-4 ${
        status.includes('✅') ? 'bg-green-50 border border-green-200' : 
        status.includes('❌') ? 'bg-red-50 border border-red-200' : 
        'bg-yellow-50 border border-yellow-200'
      }`}>
        <p className="font-medium">{status}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Configuration:</h2>
        <pre className="bg-white p-3 rounded border text-sm">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>URL: {config.hasUrl ? 'Set ✅' : 'Not set ❌'}</p>
        <p>Key: {config.hasKey ? 'Set ✅' : 'Not set ❌'}</p>
        <p className="mt-2 text-xs text-gray-400">Note: Environment variables are only available on the server. Client components receive them via Next.js's build process.</p>
      </div>
    </div>
  );
}
