import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { dismissed, shown } from '../redux/slices/toastSlice';
import { errorMessage } from '../api/client';

const VISIBLE_MS = 4000;
let counter = 0;

// Short messages at the corner of the screen: toast.success("Saved"), toast.error(err).
// error takes what a request threw, or a plain message.
const useToast = () => {
  const dispatch = useDispatch();

  return useMemo(() => {
    const show = (type, message) => {
      counter += 1;
      const id = counter;

      dispatch(shown({ id, type, message }));
      setTimeout(() => dispatch(dismissed(id)), VISIBLE_MS);
    };

    return {
      success: (message) => show('success', message),
      error: (problem) => show('error', typeof problem === 'string' ? problem : errorMessage(problem)),
    };
  }, [dispatch]);
};

export default useToast;
