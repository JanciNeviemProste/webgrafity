import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: '#0a0a0f', color: '#fff' }}>
      <Hero />
      <Features />
    </main>
  );
}
