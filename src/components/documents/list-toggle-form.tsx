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
    <section>
      <h2>Highlight lists</h2>
      <form action={action}>
        {lists.length === 0 ? <p>No built-in lists available.</p> : null}
        {lists.map((list) => (
          <label key={list.id} style={{ display: "block" }}>
            <input defaultChecked={list.isActive} name="wordListId" type="checkbox" value={list.id} />{" "}
            {list.name}
          </label>
        ))}
        <button type="submit">Update highlights</button>
      </form>
    </section>
  );
}
