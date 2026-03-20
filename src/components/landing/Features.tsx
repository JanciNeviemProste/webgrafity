const features = [
  {
    icon: '\uD83D\uDCF7',
    title: 'Odfo\u0165 stenu',
    desc: 'Pouzi kameru alebo nahraj fotku realnej steny kde chces malovat.',
  },
  {
    icon: '\uD83C\uDFA8',
    title: 'Nahraj dizajn',
    desc: 'Nahraj lubovolny obrazok — pozadie sa automaticky odstrani.',
  },
  {
    icon: '\uD83D\uDD04',
    title: 'Perspektiva',
    desc: 'Oznac 4 rohy steny a dizajn sa automaticky prizposobi tvaru.',
  },
  {
    icon: '\uD83D\uDCBE',
    title: 'Uloz a maluj',
    desc: 'Uloz preview ako PNG a podla neho to namaluj naozaj!',
  },
];

export function Features() {
  return (
    <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 pb-20 sm:grid-cols-2">
      {features.map((f, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 p-6"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="mb-3 text-3xl">{f.icon}</div>
          <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
          <p className="text-sm text-gray-500">{f.desc}</p>
        </div>
      ))}
    </section>
  );
}
