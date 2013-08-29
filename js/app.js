/**
 * 
 */

(function($) {
  
  // Container for output callbacks
  var outputHandlers = {};
  var busStop = '43275';
  var poller;
  var stops = {};
  
  // Get stops
  $.getJSON('js/stops.json', function(data) {
    stops = data;
  });

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
	
	// Event poll for bustop API
	function pollBusStopAPI() {
  	var jsonpTemplate = 'http://svc.metrotransit.org/NexTrip/[[BUSSTOP]]?format=json&callback=?';
  	var interval = 2000;
  	var poolID;
  	
  	var parseData = function(data) {
      data = _.map(data, function(s) {
        // /Date(1370124480000-0500)/ (This can't be right)
        s.time = moment(eval(s.DepartureTime.substring(6, s.DepartureTime.length - 2)));
        return s
      });
      data = _.sortBy(data, function(s) { return s.time.unix(); });
      return data;
  	};
  	
  	var getData = function() {
  	  $.getJSON(jsonpTemplate.replace('[[BUSSTOP]]', busStop), function(data) {
    	  $(window).trigger('bus', { buses: parseData(data) });
  	  });
  	};
  	
  	return {
    	poll: function() {
      	pollID = window.setInterval(function() {
      	  getData();
      	}, interval);
      },
      update: function() {
        getData();
      }
    }
	}
	poller = new pollBusStopAPI();
	poller.poll();
	
	// Get closest stop
	function getClosestStop(done) {
	  var min;
	
	  navigator.geolocation.getCurrentPosition(function(position) {
	    if (_.isObject(position)) {
        min = _.min(stops, function(s) {
          return Math.sqrt(Math.pow((s.lat - position.coords.latitude), 2) + Math.pow((s.lon - position.coords.longitude), 2));
        });
        
        done(min.id);
      }
    });
	}
	
	// Handle slide and render output
	function outputSlideHanderler(e) {
    // Re-render output
    $(e.currentSlide).find('div.output').each(function() {
      var $output = $(this);
      var handler = $output.data('outputHandler');
      var template = $('#' + 'output-template-' + handler).html();
      
      if (!_.isUndefined(outputHandlers[handler]) && _.isFunction(outputHandlers[handler])) {
        $output.html(outputHandlers[handler]($output, template));
      }
    });
	}
	
	// Ouput handler final
	outputHandlers.final = function($el, template) {
	  var ractiveView = new Ractive({
  	  el: $el,
  	  template: template,
  	  data: {
    	  
  	  }
	  });
	};
	
	// Step 1
	outputHandlers.step01 = function($el, template) {
	  busStop = '43275';
	
	  var ractiveView = new Ractive({
  	  el: $el,
  	  template: template,
  	  data: {
    	  stop: busStop,
    	  buses: [
          {
            "Actual": true,
            "BlockNumber": 1122,
            "DepartureText": "3 Min",
            "DepartureTime": "/Date(1377800220000-0500)/",
            "Description": "Emerson/26Av-Broadway",
            "Gate": "",
            "Route": "5",
            "RouteDirection": "NORTHBOUND",
            "Terminal": "F",
            "VehicleHeading": 0,
            "VehicleLatitude": 44.9888311,
            "VehicleLongitude": -93.2898608
          },
          {
            "Actual": false,
            "BlockNumber": 1132,
            "DepartureText": "1:22",
            "DepartureTime": "/Date(1377800520000-0500)/",
            "Description": "Fremont Av/Brklyn Ctr/Transit Ctr",
            "Gate": "",
            "Route": "5",
            "RouteDirection": "NORTHBOUND",
            "Terminal": "M",
            "VehicleHeading": 0,
            "VehicleLatitude": 0,
            "VehicleLongitude": 0
          }
        ]
  	  }
	  });
	};
	
	// Step 2
	outputHandlers.step02 = function($el, template) {
	  busStop = '43275';
	
	  var ractiveView = new Ractive({
  	  el: $el,
  	  template: template,
  	  data: {
    	  stop: busStop,
    	  buses: []
  	  }
	  });
	  
	  $(window).on('bus', function(e, data) {
	    ractiveView.set('buses', _.first(data.buses, 3));
	  });
	};
	
	// Step 3
	outputHandlers.step03 = function($el, template) {
	  busStop = '43275';
	
	  var buses = [];
	  var count = 0;
	  var ractiveView = new Ractive({
  	  el: $el,
  	  template: template,
  	  data: {
    	  stop: busStop,
    	  buses: buses
  	  }
	  });
	  
	  $(window).on('bus', function(e, data) {
	    buses.push(data.buses[count++]);
	  });
	};
	
	// Step 4
	outputHandlers.step04 = function($el, template) {
	  var ractiveView = new Ractive({
  	  el: $el,
  	  template: template,
  	  data: {
    	  stop: busStop,
    	  buses: []
  	  }
	  });
	  
	  $(window).on('bus', function(e, data) {
	    ractiveView.set('buses', _.first(data.buses, 3));
	  });
	  
	  ractiveView.observe('stop', function(e) {
	    busStop = this.get('stop');
	    poller.update();
	  });
	  
	  ractiveView.set('stop', '17982');
	};
	
	// Step 5
	outputHandlers.step05 = function($el, template) {
	  busStop = '43275';
	
	  var ractiveView = new Ractive({
  	  el: $el,
  	  template: template,
  	  data: {
    	  stop: busStop,
    	  buses: []
  	  }
	  });
	  
	  $(window).on('bus', function(e, data) {
	    ractiveView.set('buses', _.first(data.buses, 3));
	  });
	  
	  ractiveView.on('highlight', function(e) {
	    $(e.original.target).toggleClass('highlight');
	  });
	};
	
	// Step 6
	outputHandlers.step06 = function($el, template) {
	  busStop = '43275';
	
	  var ractiveView = new Ractive({
  	  el: $el,
  	  template: template,
  	  data: {
    	  stop: busStop,
    	  buses: []
  	  }
	  });
	  
	  $(window).on('bus', function(e, data) {
	    ractiveView.set('buses', _.first(data.buses, 3));
	  });
	  
	  ractiveView.observe('stop', function(e) {
	    busStop = this.get('stop');
	    poller.update();
	  });
	  
	  ractiveView.on('highlight', function(e) {
	    $(e.original.target).toggleClass('highlight');
	  });
	  
	  ractiveView.on('closest', function(e) {
	    e.original.preventDefault();
	    getClosestStop(function(stop) {
  	     ractiveView.set('stop', stop);
	    });
	  });
	};
	
	// Event listening to run code in a slide
	Reveal.addEventListener('slidechanged', outputSlideHanderler);
	Reveal.addEventListener('ready', outputSlideHanderler);
  
	
})(jQuery);