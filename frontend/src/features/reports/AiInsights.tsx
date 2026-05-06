import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Sparkles, TrendingDown, Info } from 'lucide-react';

export default function AiInsights() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const res = await client.get('/ai/recommendations');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60 * 24 // 24 hours
  });

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border animate-pulse flex gap-4 items-start">
        <div className="w-12 h-12 bg-primary/10 rounded-xl"></div>
        <div className="flex-1">
          <div className="h-6 w-1/3 bg-foreground/10 rounded-md mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-foreground/5 rounded-md"></div>
            <div className="h-4 w-5/6 bg-foreground/5 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-indigo-900">CafeTrac AI Insights</h2>
          <p className="text-indigo-700/70 text-sm">Smart recommendations based on your last 30 days of data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Par Level Adjustments */}
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
          <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-indigo-500" /> Smart Par Levels
          </h3>
          <div className="space-y-4">
            {data.smartParLevelAdjustments?.length > 0 ? (
              data.smartParLevelAdjustments.map((adj: any, idx: number) => (
                <div key={idx} className="border-l-4 border-indigo-400 pl-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{adj.itemName}</span>
                    <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {adj.currentPar} → {adj.recommendedPar}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60">{adj.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/60">Your par levels are perfectly optimized!</p>
            )}
          </div>
        </div>

        {/* Leftovers & General Insights */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" /> Operational Insights
            </h3>
            <ul className="space-y-2 text-sm text-foreground/70 list-disc list-inside">
              {data.insights?.map((insight: string, idx: number) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Leftover Handling
            </h3>
            <ul className="space-y-2 text-sm text-foreground/70 list-disc list-inside">
              {data.leftoverHandling?.map((tip: string, idx: number) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
