// what a page shows while it loads, when loading failed, and when there is nothing

export const Loading = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-500" role="status">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-3" aria-hidden="true"></div>
    <span>{label}</span>
  </div>
);

export const Failed = ({ message, onRetry }) => (
  <div className="card p-8 text-center" role="alert">
    <p className="text-red-600">{message}</p>
    {onRetry && <button onClick={onRetry} className="btn-quiet mt-4">Try again</button>}
  </div>
);

export const Empty = ({ children }) => (
  <div className="card p-8 text-center text-gray-600">{children}</div>
);

// a note about where the data is from
export const Note = ({ children }) => (
  <p className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md px-3 py-2" role="status">{children}</p>
);
