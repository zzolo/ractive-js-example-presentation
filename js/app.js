/**
 * 
 */

(function($) {
  
  // Container for output callbacks
  var outputs = {};

	// Full list of configuration options available here:
	// https://github.com/hakimel/reveal.js#configuration
	Reveal.initialize({
		controls: false,
		progress: true,
		history: true,
		center: true,
		theme: Reveal.getQueryHash().theme,
		transition: Reveal.getQueryHash().transition || 'default',
		dependencies: [
			{ src: 'bower_components/reveal.js/lib/js/classList.js', 
			  condition: function() { return !document.body.classList; } },
			{ src: 'bower_components/reveal.js/plugin/highlight/highlight.js', 
			  async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
			{ src: 'bower_components/reveal.js/plugin/zoom-js/zoom.js', 
			  async: true, condition: function() { return !!document.body.classList; } },
			{ src: 'bower_components/reveal.js/plugin/notes/notes.js', 
			  async: true, condition: function() { return !!document.body.classList; } }
		]
	});
	
	// Handle slide and render output
	function outputSlideHanderler(e) {
    // Re-render output
    $(e.currentSlide).find('div.output').each(function() {
      var $output = $(this);
      var handler = $output.data('outputHandler');
      
      if (!_.isUndefined(outputs[handler]) && _.isFunction(outputs[handler])) {
        $output.html(outputs[handler]());
      }
    });
	}
	
	// Event listening to run code in a slide
	Reveal.addEventListener('slidechanged', outputSlideHanderler);
	Reveal.addEventListener('ready', outputSlideHanderler);
  
	
})(jQuery);