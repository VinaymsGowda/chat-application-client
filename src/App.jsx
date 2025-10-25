import "./App.css";
import Navigation from "./Navigation/Navigation";
import { MediaProvider } from "./context/MediaProvider";
import SocketProvider from "./context/SocketContext";
// Add Radix Toast imports
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <MediaProvider>
          <Navigation />
        </MediaProvider>
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
