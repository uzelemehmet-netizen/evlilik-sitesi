export default function GuidanceTopNotice({ tone = 'emerald' } = {}) {
  const isRose = String(tone || '').toLowerCase() === 'rose';

  const headerBadgeClass = isRose
    ? 'bg-rose-50 text-rose-800 border-rose-200'
    : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  const stepBadgeClass = isRose ? 'bg-rose-600' : 'bg-emerald-700';
  const stepBorderClass = isRose ? 'border-rose-100' : 'border-emerald-100';
  const stepBgClass = isRose ? 'bg-rose-50/40' : 'bg-emerald-50/40';

  return (
    <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Kısa Tutorial</div>
          <h2 className="mt-0.5 text-base sm:text-lg font-semibold text-slate-900">
            Endonezya Evlilik Rehberliği: 2 Adımda Nasıl Çalışıyoruz?
          </h2>
        </div>

        <div className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${headerBadgeClass}`}>
          2 adım
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`rounded-2xl border ${stepBorderClass} ${stepBgClass} p-4`}>
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-8 h-8 rounded-full ${stepBadgeClass} text-white flex items-center justify-center text-sm font-bold`}>
              1
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Rehberlik hizmetimizi Endonezya’da yaşayan bir Türk ekibi olarak Endonezya’da yürütüyoruz. Endonezya’ya evlilik için
              gelecek dostlarımıza her aşamada yanlarında bulunarak destek oluyoruz; havaalanından karşılayıp, dönüşte eşinizle birlikte
              havaalanına bırakana kadar sürecin tamamında yanınızdayız.
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border ${stepBorderClass} ${stepBgClass} p-4`}>
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-8 h-8 rounded-full ${stepBadgeClass} text-white flex items-center justify-center text-sm font-bold`}>
              2
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Güven konusunda içiniz rahat olsun diye, Endonezya’ya gelene kadar hiçbir rehberlik ücreti talep etmiyoruz. Ödemeyi
              Endonezya’ya geldiğinizde yapabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
