// Noise overlay effect
export function initNoiseEffect({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15
} = {}) {
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.className = 'noise-overlay';
  canvas.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    opacity: 0.35;
    mix-blend-mode: overlay;
    z-index: 9999;
  `;
  
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let frame = 0;
  let animationId;
  const canvasSize = 1024;

  function resize() {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
  }

  function drawGrain() {
    const imageData = ctx.createImageData(canvasSize, canvasSize);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = patternAlpha;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  function loop() {
    if (frame % patternRefreshInterval === 0) {
      drawGrain();
    }
    frame++;
    animationId = window.requestAnimationFrame(loop);
  }

  // Initialize
  window.addEventListener('resize', resize);
  resize();
  loop();

  // Return cleanup function
  return function cleanup() {
    window.removeEventListener('resize', resize);
    window.cancelAnimationFrame(animationId);
    canvas.remove();
  };
}
