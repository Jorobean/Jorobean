import { initWaveEffect } from './waveEffect.js';
import { initFormHandler } from './formHandler.js';
import { initTiltEffect } from './tiltEffect.js';
import { initLogoScroll } from './logoScroll.js';
import { initNoiseEffect } from './noiseEffect.js';

// Initialize all modules when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initWaveEffect();
  initFormHandler();
  initTiltEffect();
  
  // Initialize noise effect with custom settings
  initNoiseEffect({
    patternRefreshInterval: 2,    // Faster refresh for more movement
    patternAlpha: 25,            // More visible
    patternSize: 128             // Smaller grain size for more detail
  });
  initLogoScroll();
});
