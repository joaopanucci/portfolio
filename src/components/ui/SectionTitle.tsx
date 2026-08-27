type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionTitle({
  eyebrow,
  title,
  description
}: SectionTitleProps) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <span className="mb-4 block text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          {eyebrow}
        </span>
      )}

      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 leading-7 text-neutral-400">
          {description}
        </p>
      )}
    </div>
  );
}