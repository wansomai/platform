'use client';

import { useState } from 'react';

export default function GeneratePage() {
  const [phase, setPhase] = useState('phase1_africa_en');
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const res = await fetch(`api/agents/lawyer-pages?phase=${phase}`, { method: 'POST' });
    setLog(await res.json());
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generate Landing Pages</h1>

      <label className="block mb-4">
        JSON file basename&nbsp;
        <input
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          className="border p-2 rounded"
        />
      </label>

      <button
        onClick={run}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Running…' : 'Generate'}
      </button>

      {log && (
        <pre className="mt-6 bg-gray-100 p-4 rounded max-h-96 overflow-y-scroll text-sm">
          {JSON.stringify(log, null, 2)}
        </pre>
      )}
    </div>
  );
}
