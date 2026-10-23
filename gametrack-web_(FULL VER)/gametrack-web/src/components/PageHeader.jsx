// Заголовок страницы: такой же, как был в MVP (крупный текст, подпись и линия снизу)
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-neutral-200 pb-5">
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
