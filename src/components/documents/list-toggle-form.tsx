type ListToggleFormProps = {
  lists: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  action: (formData: FormData) => Promise<void>;
};

export function ListToggleForm({ lists, action }: ListToggleFormProps) {
  return (
    <section className="surface-card">
      <h2 className="display-copy text-3xl font-semibold text-zinc-950">Vocabulary highlights</h2>
      <p className="mt-3 text-sm leading-7 text-zinc-600">
        Choose which study lists should stand out while you read. To save a note, select text in
        the reading view and right-click.
      </p>
      <form action={action} className="mt-5 space-y-4">
        {lists.length === 0 ? (
          <p className="rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            No built-in lists available.
          </p>
        ) : null}
        {lists.map((list) => (
          <label
            key={list.id}
            className="flex cursor-pointer items-center gap-3 rounded-[1.25rem] border border-zinc-200/80 bg-white/75 px-4 py-3 text-sm font-medium text-zinc-900"
          >
            <input
              defaultChecked={list.isActive}
              name="wordListId"
              type="checkbox"
              value={list.id}
            />
            <span>{list.name}</span>
          </label>
        ))}
        <button className="button-primary w-full justify-center sm:w-auto" type="submit">
          Update highlights
        </button>
      </form>
    </section>
  );
}
