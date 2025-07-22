import { initWaveEffect } from './waveEffect.js';
import { initFormHandler } from './formHandler.js';
import { initTiltEffect } from './tiltEffect.js';
import { initLogoScroll } from './logoScroll.js';

// Initialize all modules when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initWaveEffect();
  initFormHandler();
  initTiltEffect();
  initLogoScroll();
});
