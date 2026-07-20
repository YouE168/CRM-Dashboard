"use client";

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function TestSupabasePage() {
  const [status, setStatus] = useState('Checking...');
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    const test = async () => {
      const configured = isSupabaseConfigured();
      setConfig({
        configured,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });

      if (configured) {
        try {
          const { data, error } = await supabase.from('programs').select('count').limit(1);
          if (error) {
            setStatus(`❌ Error: ${error.message}`);
          } else {
            setStatus('✅ Connected to Supabase successfully!');
          }
        } catch (e: any) {
          setStatus(`❌ Error: ${e.message}`);
        }
      } else {
        setStatus('⚠️ Supabase not configured. Please check your environment variables.');
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
    </div>
  );
}
