import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-4 p-8 text-center">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      <p className="text-zinc-400">{message}</p>
    </div>
  );
}