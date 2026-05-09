import { useEffect } from "react";
import IntroScene from "./IntroScene";

function App() {
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (screen.orientation && (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock) {
          await (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock("landscape");
        }
      } catch {
        // Fallback silently — Android manifest enforces landscape
      }
    };
    lockOrientation();
  }, []);

  return (
    <IntroScene
      onComplete={() => {
        // Game stops here — waiting for next scene command
      }}
    />
  );
}

export default App;
