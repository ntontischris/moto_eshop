interface SpecificationsTableProps {
  specs: Record<string, string>;
}

export function SpecificationsTable({ specs }: SpecificationsTableProps) {
  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value], index) => (
            <tr
              key={key}
              className={index % 2 === 0 ? "bg-muted/50" : "bg-background"}
            >
              <td className="w-1/3 px-4 py-2.5 font-medium text-muted-foreground">
                {key}
              </td>
              <td className="px-4 py-2.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
