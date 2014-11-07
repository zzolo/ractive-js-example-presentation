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
    var interval = 20000;
    var poolID;
    var cache = {};
    var lastTime = Date.now();
    var makingCall = false;

    var colorScale = chroma.scale(['#FF0040', '#40FF00'].reverse()).mode('hsl').domain([0, 20]);

    var parseData = function(data) {
      data = _.map(data, function(s) {
        // /Date(1370124480000-0500)/ (This can't be right)
        s.time = moment(eval(s.DepartureTime.substring(6, s.DepartureTime.length - 2)));
        s.now = moment();
        s.minutes = moment.duration(s.time.diff(s.now)).minutes();
        s.bgColor = colorScale(s.minutes).hex();
        return s
      });
      data = _.sortBy(data, function(s) { return s.time.unix(); });
      return data;
    };

    var getData = function() {
      var currentBusStop = busStop;
      var now = Date.now();

      // Use a basic cache so the API is not hit so often
      if (cache[currentBusStop] && now - lastTime < interval) {
        $(window).trigger('bus', cache[currentBusStop]);
      }
      else if (!makingCall) {
        makingCall = true;
        $.getJSON(jsonpTemplate.replace('[[BUSSTOP]]', currentBusStop), function(data) {
          lastTime = Date.now();
          cache[currentBusStop] = { buses: parseData(data) };
          $(window).trigger('bus', { buses: parseData(data) });
          makingCall = false;
        });
      }
    };

    return {
      poll: function() {
        pollID = window.setInterval(function() {
          getData();
        }, interval);
      },
      update: function() {
        getData();
      },
      colorScale: colorScale
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
    poller.update();

    $(window).on('bus', function(e, data) {
      ractiveView.set('buses', _.first(data.buses, 5));
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

    poller.update();
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
      ractiveView.set('buses', _.first(data.buses, 5));
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
      ractiveView.set('buses', _.first(data.buses, 5));
    });

    ractiveView.on('highlight', function(e) {
      $(e.original.target).toggleClass('highlight');
    });

    poller.update();
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
      ractiveView.set('buses', _.first(data.buses, 5));
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

    poller.update();
  };

  // Step 7
  outputHandlers.step07 = function($el, template) {
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
      ractiveView.set('buses', _.first(data.buses, 5));
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

    poller.update();
  };

  // Step 8
  outputHandlers.step08 = function($el, template) {
    busStop = '43275';

    var ractiveView = new Ractive({
      el: $el,
      template: template,
      data: {
        stop: busStop,
        buses: [],
        formatTime: function(moment, format) {
          format = format || 'h:mm A';
          return moment.format(format);
        }
      }
    });

    $(window).on('bus', function(e, data) {
      ractiveView.set('buses', _.first(data.buses, 5));
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

    poller.update();
  };

  // Step 9
  outputHandlers.step09 = function($el, template) {
    busStop = '43275';

    var ractiveView = new Ractive({
      el: $el,
      template: template,
      data: {
        stop: busStop,
        buses: [],
        formatTime: function(moment, format) {
          format = format || 'h:mm A';
          return moment.format(format);
        }
      }
    });

    $(window).on('bus', function(e, data) {
      ractiveView.set('buses', _.first(data.buses, 5));
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

    poller.update();
  };

  // Step 10
  outputHandlers.step10 = function($el, template) {
    busStop = '43275';

    var ractiveView = new Ractive({
      el: $el,
      template: template,
      data: {
        stop: busStop,
        buses: [],
        bg: [],
        formatTime: function(moment, format) {
          format = format || 'h:mm A';
          return moment.format(format);
        }
      }
    });

    $(window).on('bus', function(e, data) {
      ractiveView.set('buses', _.first(data.buses, 5));
    });

    ractiveView.observe('stop', function(e) {
      busStop = this.get('stop');
      poller.update();
    });

    /*
    // Want to animate buses[x].bgColor
    // which is based on buses[x].bgColor
    // but how to animate it but, not have it
    // update on the set
    ractiveView.observe('buses', function(oldV, newV) {
      _.each(newV, function(b, i) {
        var path = 'bg.' + i;

        ractiveView.animate(path, b.minutes, {
          duration: 1000,
          step: function(t, value) {
            ractiveView.set(path, poller.colorScale(value).hex());
            return value;
          },
        });
      });
    });
    */

    ractiveView.on('highlight', function(e) {
      $(e.original.target).toggleClass('highlight');
    });

    ractiveView.on('closest', function(e) {
      e.original.preventDefault();
      getClosestStop(function(stop) {
         ractiveView.set('stop', stop);
      });
    });

    poller.update();
  };


  // Event listening to run code in a slide
  Reveal.addEventListener('slidechanged', outputSlideHanderler);
  Reveal.addEventListener('ready', outputSlideHanderler);


})(jQuery);
