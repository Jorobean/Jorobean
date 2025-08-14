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
      // Switch to wave effect
      comingSoonSVG.classList.remove('active');
      setTimeout(() => {
        waveSVG.classList.add('active');
      }, 400);
    } else {
      // Switch to coming soon
      waveSVG.classList.remove('active');
      setTimeout(() => {
        comingSoonSVG.classList.add('active');
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

  // Initial state - start with Coming Soon
  isWaveShown = false;
  updateWaveText();
}
