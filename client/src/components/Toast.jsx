import { useDispatch, useSelector } from 'react-redux';
import { dismissed } from '../redux/slices/toastSlice';

const STYLES = {
  success: 'bg-green-600',
  error: 'bg-red-600',
};

// the message useToast shows; one at a time, above everything else
const Toast = () => {
  const toast = useSelector((state) => state.toast.current);
  const dispatch = useDispatch();

  if (!toast) return null;

  return (
    <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[60] flex justify-center sm:justify-end pointer-events-none">
      <div role={toast.type === 'error' ? 'alert' : 'status'} className={`pointer-events-auto max-w-sm w-full sm:w-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${STYLES[toast.type]}`}>
        <span className="break-words min-w-0">{toast.message}</span>
        <button onClick={() => dispatch(dismissed(toast.id))} aria-label="Dismiss" className="ml-auto opacity-80 hover:opacity-100">✕</button>
      </div>
    </div>
  );
};

export default Toast;
