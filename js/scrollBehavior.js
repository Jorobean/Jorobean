// Ensure consistent scroll behavior across all pages
(function() {
    // Prevent browser from restoring previous scroll position
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }

    // Force scroll to top on page refresh or initial load
    if (performance.navigation.type === 1 || document.readyState === 'loading') {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Backup handler for when page is about to be unloaded
    window.onbeforeunload = function() {
        window.scrollTo(0, 0);
    };
})();
