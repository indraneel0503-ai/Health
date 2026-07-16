import { ReactNode, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  loading,
  searchKey,
  searchPlaceholder = 'Search...',
  onAdd,
  addLabel = 'Add New',
  onEdit,
  onDelete,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');

  const filtered = searchKey
    ? data.filter((row) =>
        String((row as Record<string, unknown>)[searchKey] ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="card overflow-hidden">
      {(searchKey || onAdd) && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          {searchKey && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
          )}
          {onAdd && (
            <button onClick={onAdd} className="btn-primary whitespace-nowrap">
              <Plus className="w-4 h-4" /> {addLabel}
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">{emptyMessage}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-gray-500 dark:text-gray-400">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">{col.label}</th>
                ))}
                {(onEdit || onDelete) && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((row) => (
                <tr key={row.id} className="table-row-hover">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className="btn-ghost p-1.5">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className="btn-ghost p-1.5 text-error-500 hover:text-error-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
