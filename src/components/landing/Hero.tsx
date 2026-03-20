import Link from 'next/link';

export function Hero() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
        style={{
          background: 'linear-gradient(135deg, #ff006e, #8338ec)',
        }}
      >
        <span role="img" aria-label="paint">&#x1f3a8;</span>
      </div>

      <h1 className="mb-4 text-5xl font-black tracking-tight md:text-6xl">
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(135deg, #ff006e, #fb5607, #ffbe0b)',
          }}
        >
          AR Graffiti
        </span>
      </h1>

      <p className="mb-8 max-w-md text-lg text-gray-400">
        Vizualizuj street art na realnych stenach. Otvor kameru, oznac stenu a vyber dizajn.
      </p>

      <Link
        href="/studio"
        className="rounded-xl px-8 py-4 text-lg font-bold text-white transition-transform hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #ff006e, #8338ec)',
        }}
      >
        Spustit studio
      </Link>
    </section>
  );
}
