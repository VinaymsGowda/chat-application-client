import { useMemo } from "react";
import { useMedia } from "../context/MediaProvider";
import { useToast } from "../context/ToastContext";
import MediaController from "../services/MediaController";

/**
 * Custom hook that provides access to the centralized MediaController
 * Eliminates the need for duplicate media control logic in components
 */
export const useMediaController = () => {
  const mediaContext = useMedia();
  const toastContext = useToast();

  // Create MediaController instance with memoization to prevent recreation on every render
  const mediaController = useMemo(() => {
    return new MediaController(mediaContext, toastContext);
  }, [mediaContext, toastContext]);

  return {
    mediaController,
    // Expose commonly used states for convenience
    mediaStates: mediaController.getMediaStates(),
    isLocalVideoAvailable: mediaController.isLocalVideoAvailable(),
    isLocalAudioAvailable: mediaController.isLocalAudioAvailable(),
    // Expose media context for components that still need direct access
    mediaContext,
  };
};

export default useMediaController;
