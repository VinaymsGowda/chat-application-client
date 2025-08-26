import "./App.css";
import Navigation from "./Navigation/Navigation";
import SocketProvider from "./context/SocketContext";
// Add Radix Toast imports
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <Navigation />
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
