$(document).ready(function() {

    // Setup temperature & humidity chart.
    // use jquery get()
    // get first node in the jQuery collection
    var ctx = $('#dht_chart').get(0).getContext('2d');

    var dhtChart = new Chart(ctx).Line({
        labels: [],
        datasets: [
        {
            label: "Temperature (Celsius)",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: []
        },
        {
            label: "Humidity (%)",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: []
        }
        ]

    });

    // Setup server sent event endpoint for /switch
    // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events

    // When javascript source file is not in python template, I think can't use flask url_for
    //var thingSource = new EventSource("{{ url_for('thing') }}");
    // use url literal
    var thingSource = new EventSource("/thing");

    function updateSwitch(switchValue) {
        if (switchValue === 0) {
            // find element with id switch_value, set text
            $('#switch_value').text('Off');
            $('#switch_value').toggleClass('label-danger', false);
            $('#switch_value').toggleClass('label-default', true);
        } else if (switchValue === 1) {
            $('#switch_value').text('On');
            $('#switch_value').toggleClass('label-danger', true);
            $('#switch_value').toggleClass('label-default', false);
        }
    }

    function updateThing(thingState) {
        // thingState.switch is syntactic sugar for thingState['switch']
        updateSwitch(thingState.switch);
        console.log('Temperature : ', thingState.temperature);
        console.log('Humidity: ', thingState.humidity);
        dhtChart.addData([thingState.temperature, thingState.humidity],
                new Date().toLocaleTimeString());

        // limit history to dataLengthMaximum most recent readings by removing first
        var dataLengthMaximum = 20;
        if (dhtChart.datasets[0].points.length >= dataLengthMaximum) {
            dhtChart.removeData()
        }
    }

    // configure server sent event receiver
    thingSource.onmessage = function(thingEvent) {
        // event data shows on web page but at first I couldn't see it in console log
        // Chrome / View / Developer / Developer tools / console log didn't work
        // Chrome / View / Developer / JavaScript console works
        // now either one works! May be because filter default was not "all"
        // http://stackoverflow.com/questions/18760213/chrome-console-log-console-debug-are-not-working
        // console.log(thingEvent.data);
        jsonObject = $.parseJSON(thingEvent.data)
            updateThing(jsonObject);
    }

    // attempt to connect to server
    var socket = io.connect();

    // register to listen for event 'connect' which fires when client connects
    socket.on('connect', function() {
        console.log('Client connected!');
    });

    // Attach button click handlers
    $('#led_on').click(function() {
        console.log('LED on!');
        // send POST request to server.
        // traditional, non WebSocket method
        //$.post('/led/1');

        // use emit to push to server
        // socketio will use WebSocket if available, else fall back to http
        // emit an event with a name and a payload of json object or string
        socket.emit('change_led', 'on');
    });

    $('#led_off').click(function() {
        console.log('LED off!');
        socket.emit('change_led', 'off');
    });

});
