import * as ToastPrimitive from "@radix-ui/react-toast";
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useReducer,
} from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function toastReducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return [...state, action.toast];
    case "REMOVE_TOAST":
      return state.filter((t) => t.id !== action.id);
    case "CLOSE_TOAST":
      return state.map((t) => (t.id === action.id ? { ...t, open: false } : t));
    case "OPEN_TOAST":
      return state.map((t) => (t.id === action.id ? { ...t, open: true } : t));
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const idRef = useRef(0);

  const showToast = useCallback(
    ({ title, description, duration = 4000, type = "success" }) => {
      const id = ++idRef.current;
      dispatch({
        type: "ADD_TOAST",
        toast: {
          id,
          title,
          description,
          open: true,
          duration,
          type,
        },
      });
    },
    []
  );

  const closeToast = useCallback((id) => {
    dispatch({ type: "CLOSE_TOAST", id });
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", id });
    }, 250);
  }, []);

  const handleOpenChange = (id, open) => {
    if (!open) closeToast(id);
    else dispatch({ type: "OPEN_TOAST", id });
  };

  const typeStyles = {
    success: {
      root: "bg-green-50 border-green-400 text-green-900",
      title: "text-green-800",
      desc: "text-green-700",
      close: "text-green-400 hover:text-green-700",
    },
    error: {
      root: "bg-red-50 border-red-400 text-red-900",
      title: "text-red-800",
      desc: "text-red-700",
      close: "text-red-400 hover:text-red-700",
    },
    warning: {
      root: "bg-yellow-50 border-yellow-400 text-yellow-900",
      title: "text-yellow-800",
      desc: "text-yellow-700",
      close: "text-yellow-400 hover:text-yellow-700",
    },
  };

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => {
          const styles = typeStyles[toast.type] || typeStyles.success;
          return (
            <ToastPrimitive.Root
              key={toast.id}
              open={toast.open}
              onOpenChange={(open) => handleOpenChange(toast.id, open)}
              duration={toast.duration}
              type="foreground"
              className={`shadow-lg rounded-lg border px-6 py-4 mb-4 w-full max-w-xs flex flex-col gap-1 animate-slide-in relative ${styles.root}`}
              style={{ pointerEvents: "auto" }}
            >
              {toast.title && (
                <ToastPrimitive.Title
                  className={`font-semibold text-base mb-1 ${styles.title}`}
                >
                  {toast.title}
                </ToastPrimitive.Title>
              )}
              <ToastPrimitive.Description className={`text-sm ${styles.desc}`}>
                {toast.description}
              </ToastPrimitive.Description>
              <ToastPrimitive.Close
                aria-label="Close"
                className={`absolute top-2 right-2 text-lg bg-transparent border-none cursor-pointer ${styles.close}`}
                onClick={() => closeToast(toast.id)}
              >
                ×
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed top-6 right-6 z-[100] w-96 max-w-full flex flex-col items-end space-y-2 outline-none" />
        <style>{`
          @keyframes slide-in {
            from { opacity: 0; transform: translateY(-20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-slide-in {
            animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}</style>
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
