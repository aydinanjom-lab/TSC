import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon, title, description, buttonText, buttonLink }) {
  const IconComponent = icon;
  return (
    <div className="p-6 md:p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center max-w-md w-full p-8 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        {IconComponent && <IconComponent className="w-16 h-16 text-zinc-500 mx-auto mb-6" />}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 mb-6">{description}</p>
        {buttonText && buttonLink && (
          <Link to={buttonLink}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">{buttonText}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}