// Wave text effect with automatic switching
export function initWaveEffect() {
  const waveTextContainer = document.querySelector('.wave-text-container');
  if (!waveTextContainer) return;
  const comingSoonSVG = waveTextContainer.querySelector('.coming-soon');
  const waveSVG = waveTextContainer.querySelector('.wave-effect');

  let isWaveShown = true;
  const SWITCH_INTERVAL = 5000; // Switch every 5 seconds

  function updateWaveText() {
    if (isWaveShown) {
      // First hide the current text
      comingSoonSVG.style.opacity = 0;
      // Wait for fade out to complete before showing new text
      setTimeout(() => {
        waveSVG.style.opacity = 1;
        comingSoonSVG.style.opacity = 0;
      }, 400);
    } else {
      // First hide the current text
      waveSVG.style.opacity = 0;
      // Wait for fade out to complete before showing new text
      setTimeout(() => {
        comingSoonSVG.style.opacity = 1;
        waveSVG.style.opacity = 0;
      }, 400);
    }
  }

  // Auto-switching animation
  function switchText() {
    isWaveShown = !isWaveShown;
    updateWaveText();
  }

  // Start the automatic switching
  setInterval(switchText, SWITCH_INTERVAL);

  // Initial state
  updateWaveText();
}
