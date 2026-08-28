import { LoaderCircle } from 'lucide-react';

/** Locked English mark for every full-screen loading gate. */
export const AUTH_LOADING_COPY = 'Completing sign in...';

/** First Influencer auth frame: dark + /favicon.svg + lime LoaderCircle + locked copy. */
export function AuthLoadingFrame() {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <img
          src="/favicon.svg"
          alt="Baise"
          className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg"
        />
        <LoaderCircle className="w-12 h-12 animate-spin mx-auto mb-4 text-[#F5FF3D]" />
        <p className="text-muted-foreground">{AUTH_LOADING_COPY}</p>
      </div>
    </div>
  );
}
