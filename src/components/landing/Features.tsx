const features = [
  {
    icon: '\uD83D\uDCF7',
    title: 'Live kamera',
    desc: 'Pouzi kameru telefonu a vidis graffiti v realnom case na stene.',
  },
  {
    icon: '\uD83C\uDFA8',
    title: '5 dizajnov',
    desc: 'Vyber si z galerie predpripravenych street art dizajnov.',
  },
  {
    icon: '\uD83D\uDD04',
    title: 'Perspektiva',
    desc: 'Automaticka perspektivna transformacia na lubovolny tvar steny.',
  },
  {
    icon: '\uD83D\uDCBE',
    title: 'Export do PNG',
    desc: 'Uloz vysledok ako obrazok a zdielaj ho s kamaratmi.',
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
