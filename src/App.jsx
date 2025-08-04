import "./App.css";
import Navigation from "./Navigation/Navigation";
// Add Radix Toast imports
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <Navigation />
    </ToastProvider>
  );
}

export default App;
