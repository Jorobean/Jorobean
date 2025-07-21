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
      comingSoonSVG.style.opacity = 0;
      // Add delay before showing the wave text
      setTimeout(() => {
        waveSVG.style.opacity = 1;
      }, 800);
    } else {
      waveSVG.style.opacity = 0;
      // Add delay before showing the coming soon text
      setTimeout(() => {
        comingSoonSVG.style.opacity = 1;
      }, 800);
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
