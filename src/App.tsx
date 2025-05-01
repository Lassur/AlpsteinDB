
import { useEffect, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';

interface GipfelEintrag {
  _id: string;
  Gipfel: string;
  Datum_JMT: string;
  Wer: string;
  Route: string;
  Notiz: string;
  Jahr: string;
  Buch: string;
  Erstbegehung: string;
}

const columns: ColumnDef<GipfelEintrag>[] = [
  { accessorKey: 'Gipfel', header: 'Gipfel' },
  { accessorKey: 'Datum_JMT', header: 'Datum' },
  { accessorKey: 'Wer', header: 'Wer' },
  { accessorKey: 'Route', header: 'Route' },
  { accessorKey: 'Notiz', header: 'Notiz' },
  { accessorKey: 'Jahr', header: 'Jahr' },
  { accessorKey: 'Buch', header: 'Buch' },
  { accessorKey: 'Erstbegehung', header: 'Erstbegehung' },
];

export default function App() {
  const [data, setData] = useState<GipfelEintrag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://alpsteindb.onrender.com/api/eintraege')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Gipfelbuch-Einträge</h1>
      {loading ? <p>Lade Daten...</p> : (
        <table border={1} cellPadding={5} cellSpacing={0}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
