var Dyceware = Dyceware || { };
Dyceware.MoonCalendar = Dyceware.MoonCalendar || { };

Dyceware.MoonCalendar.MoonCalendar = function(options) {

    var that = { };
    var options = options || { };
    var isLoaded = false;

    // UI properties
    var $container = options.container || $("#moon-tracker");
    var height = options.height ? options.height : 500;
    var width = options.width ? options.width : 500;
    var outerRadius = Math.min(width * 0.9, height * 0.9) / 2;
    var center = { x: width / 2, y: height / 2 };
    var arcWidth = (outerRadius * 2) / 15;
    var arcSpacing = arcWidth / 4;
	var rotationDegrees = -225;

    // UI layers
    var stage = new Kinetic.Stage({ container: 'moon-tracker', width: width, height: height });
    var moonLayer = new Kinetic.Layer();
    var phaseLayer = new Kinetic.Layer();
    var displayLayer = new Kinetic.Layer();
    
    // Phase Members
    var phases = buildPhaseViewModel(options.phases, options.moons);
    var highSanctionLabel = new Kinetic.Text({ x: 10, y: 10, fontFamily: 'Helvetica Neue', fontSize: 24, text: '', fill: 'black' });
    var lowSanctionLabel = new Kinetic.Text({ x: 10, y: 10, fontFamily: 'Helvetica Neue', fontSize: 24, text: '', fill: 'black' });
    var waxingLabel = new Kinetic.Text({ x: 10, y: 10, fontFamily: 'Helvetica Neue', fontSize: 24, text: '', fill: 'black' });
    var waningLabel = new Kinetic.Text({ x: 10, y: 10, fontFamily: 'Helvetica Neue', fontSize: 24, text: '', fill: 'black' });

    // Display Members
    var coordinateText = new Kinetic.Text({ x: 10, y: 10, fontFamily: 'Helvetica Neue', fontSize: 24, text: '', fill: 'black' });
    var dateText = new Kinetic.Text({ x: center.x, y: center.y, fontFamily: 'Helvetica Neue', fontSize: 20, text: '', fill: 'black', align: 'center', offsetY: 10 });
    
    // Model Objects
    var moons = buildMoonViewModel(options.moons);
    var intersections = ko.observable([]);

    init();

    function init() {
        // phases
        for (var i = 0; i < phases.length; i++) {
            phaseLayer.add(phases[i].arc);

            if (phases[i].labelVisible) {
                phaseLayer.add(phases[i].label);
            }
        };
        phaseLayer.add(highSanctionLabel);
        phaseLayer.add(lowSanctionLabel);
        phaseLayer.add(waxingLabel);
        phaseLayer.add(waningLabel);
        stage.add(phaseLayer);

        // moons
        stage.add(moonLayer);

        // display
        displayLayer.add(coordinateText);
        displayLayer.add(dateText);
        stage.add(displayLayer);

        drawMoons(0);
        displayDate("");
    };

    function buildPhaseViewModel(phaseDataCollection, moonDataCollection) {

        var phases = [];

        for (var i = 0; i < phaseDataCollection.length; i++) {
            var phase = phaseDataCollection[i];
            var innerRadius = outerRadius - (moonDataCollection.length * (arcWidth + arcSpacing));
            var inversionFactor = (phase.labelPosition == "below") ? -1 : 1;
            var verticalOffset = (phase.labelPosition == "below") ? 20 : 30;

            var phaseArc = new Kinetic.Arc({
                innerRadius: innerRadius,
                outerRadius: outerRadius + (arcSpacing),
                fill: phase.color,
                angle: -(phase.arcWidth),
                rotationDeg: -(phase.startAngle),
                clockwise: true,
                x:center.x,
                y:center.y,
            });
            var phaseLabel = new Kinetic.Text({ 
                x: center.x, 
                y: center.y + (inversionFactor * (innerRadius - verticalOffset)),
                fontFamily: 'Helvetica Neue', 
                fontSize: 14,
                text: phase.name, 
                fill: 'black' 
            });
            phaseLabel.offsetX(phaseLabel.width() / 2);
            
			phase.arc = phaseArc;
			phase.label = phaseLabel;
            phases.push(phase);
        };

        return phases;
    }
    
    function buildMoonViewModel(moonDataCollection) {
        var moons = [];
        for (var i = 0; i < moonDataCollection.length; i++) {
            // radius should get smaller for each new moon
            var newMoonRadius = outerRadius - (i * (arcWidth + arcSpacing));
            var newMoon = buildMoon(moonDataCollection[i], newMoonRadius);
            moons.push(newMoon);
        }
        return moons;
    };

    function buildMoon(moon, radius) {
        degreesPerSection = 360 / moon.daysPerCycle;
        bufferDegrees = 2;

        arcs = [];
        for (var i = 0; i < moon.daysPerCycle; i++) {

            var arcLengthInDegrees = -(degreesPerSection - (bufferDegrees / 2)); // inverted endAngle
            var startAngle = -(moon.radialOrigin + (i*degreesPerSection) + (bufferDegrees / 2)); // startAngle

            var arc = new Kinetic.Arc({
                innerRadius: radius - arcWidth,
                outerRadius: radius,
                stroke: 'black',
                strokeWidth: 1,
                fill: '#00D2FF',
                angle: arcLengthInDegrees,
                rotationDeg: startAngle,
                clockwise: true,
                x:center.x,
                y:center.y,
            });

            arc.on('mouseover', function() {
                var arcStart = this.getRotation();
                var arcEnd = this.getRotation() + this.getAngle();
                displayCoordinates({ 'arcStart': arcStart, 'arcEnd': arcEnd });

                if (this.isActive) {
                    
                }
            });

            moonLayer.add(arc);
            arcs.push(arc);
        }
		
		moon.phase = ko.observable({});
        moon.arcs = arcs;
        return moon;
    };

    function drawMoons(daysFromZero) {
        
        var arcs = [];
        var positions = calcMoonPositions(daysFromZero);
        for (var i = 0; i < moons.length; i++) {
            
			// set moon position
			moons[i].position = positions[i];
            colorMoon(moons[i]);
			
			// set moon phase
			moons[i].phase(calcMoonPhase(moons[i]));
						
            var activeArc = moons[i].arcs[moons[i].position];
            arcs.push({ id : moons[i].name, value : activeArc });
        }

		// check for intersections
        intersections(checkArcIntersections(arcs));
        if (intersections().length > 0) {
            $(that).trigger("intersection", { intersections: intersections() });
        }

        moonLayer.draw();
    };

    function simulateIntersection(daysFromZero) {

        var positions = calcMoonPositions(daysFromZero);

        // check for intersections
        var arcs = [];
        for (var i = 0; i < moons.length; i++) {

            var activeArc = moons[i].arcs[positions[i]];
            arcs.push({
                id : moons[i].name,
                value : activeArc
            });
        }

        return checkArcIntersections(arcs);
    };

    function calcMoonPositions(daysFromZero) {

        var positions = [];

        for (var i = 0; i < moons.length; i++) {

            var offset = moons[i].startingPosition;
            var newPosition = daysFromZero + moons[i].startingPosition; // include offset
            var arcIndex = (newPosition % moons[i].arcs.length);
            positions.push(arcIndex);
        }

        return positions;
    };

    function calcMoonPhase(moon, anyOverlap) {
		var phasesToTest = [];
		
		// prep phase data
		for (var i = 0; i < phases.length; i++) {
			var phaseArc = phases[i].arc;
			var start = -phaseArc.getRotation();
			var end = -(phaseArc.getRotation() + phaseArc.getAngle());
			
			if (end > 360) {
				// split the phase into two sections and test both of them separately
				phasesToTest.push({ name: phases[i].name, start: start, end: 360 });
				phasesToTest.push({ name: phases[i].name, start: 0, end: end % 360 });
			} else {
				phasesToTest.push({ name: phases[i].name, start: start, end: end });
			}
		}
	
		for (var i = 0; i < phasesToTest.length; i++) {
			var a = moon.arcs[moon.position]; // active arc

			// inverse the signs so the angles are positive for local comparison
			var aStart = -(a.getRotation());
			var aEnd = -(a.getRotation() + a.getAngle());

			var bStart = phasesToTest[i].start;
			var bEnd = phasesToTest[i].end;
									
			var isOverlap = anyOverlap ? AnyOverlap(aStart, aEnd, bStart, bEnd) : AtLeastHalfOverlap(aStart, aEnd, bStart, bEnd);
			if (isOverlap) {
				return phasesToTest[i].name;
			}
			
		}
    };

    function colorMoon(moon) {
        // refreshes the color for the moon based on the model data
        for (var i = 0; i < moon.arcs.length; i++) {
            moon.arcs[i].isActive = (i == moon.position);
            moon.arcs[i].fill(moon.arcs[i].isActive ? moon.activeColor : moon.color);
        }
    };

    function checkArcIntersections(arcs, anyOverlap) {

        // NOTE: Will fail with "negative" dates (dates which are less than zeroTime)
        var results = [];

        for (var i = 0; i < arcs.length - 1; i++) {
            for (var j = i+1; j < arcs.length; j++) {
                var a = arcs[i].value;
                var b = arcs[j].value;

                // inverse the signs so the angles are positive for local comparison
                var aStart = -a.getRotation();
                var aEnd = -(a.getRotation() + a.getAngle());

                var bStart = -b.getRotation();
                var bEnd = -(b.getRotation() + b.getAngle());

                // check if the ranges overlap
                var isOverlap = anyOverlap ? AnyOverlap(aStart, aEnd, bStart, bEnd) : AtLeastHalfOverlap(aStart, aEnd, bStart, bEnd);
                if (isOverlap) {
                    results.push([arcs[i].id, arcs[j].id]);
                }
            }
        }

        return results;
    };

    function AnyOverlap(x1, x2, y1, y2) {
        return Math.max(x1,y1) <= Math.min(x2,y2);
    };

    function AtLeastHalfOverlap(x1, x2, y1, y2) {
        // 50% or more overlap
        var midX = (x1 + x2) / 2;
        var midY = (y1 + y2) / 2;

        var midXInY = (midX >= y1) && (midX <= y2);
        var midYInX = (midY >= x1) && (midY <= x2);

        return midXInY || midYInX;
    };

    function rotate() {

        for (var i = 0; i < moons.length; i++) {
            for (var j = 0; j < moons[i].arcs.length; j++) {
                moons[i].arcs[j].rotateDeg(rotationDegrees);
            }
        }
    };

    function displayCoordinates(coords) {
        if (options.debug) {
            var arcStart = Math.round(coords.arcStart * 100) / 100;
            var arcEnd = Math.round(coords.arcEnd * 100) / 100;
            coordinateText.setText("start: " + arcStart + "°, end: " + arcEnd + "°");
            displayLayer.draw();
        }
    };

    function displayDate(date) {
        dateText.setText(date);
        dateText.offsetX(dateText.width() / 2); // cause align: 'center' doesn't work
        displayLayer.draw();
    };

    function resize(options) {

        var oldWidth = stage.width();
        var scaleFactor = options.width / oldWidth;

        stage.setScale({ x : scaleFactor, y: scaleFactor });
        stage.setSize({ 
            width : (options.width > oldWidth) ? options.width : oldWidth, 
            height : options.height
        });

        stage.draw();
    }

    // ================================
    // -====== Public Interface ======-
    // ================================
    that.draw = function(daysFromZero) {
        drawMoons(daysFromZero);
        return that;
    };

    that.displayDate = function(dateString) {
        displayDate(dateString);
        return that;
    };

    that.hasIntersections = ko.computed(function() {
        return intersections().length > 0;
    });

    that.intersections = intersections;

	that.phases = ko.computed(function() {
		var phases = [];
		for (var i = 0; i < moons.length; i++) {
			phases.push({
				moon : { name : moons[i].name, robe : moons[i].robe }, 
				phase : moons[i].phase()
			});
		}
		return phases;
	});

    that.resize = function(options) {
        resize(options);
        return that;
    };
	
    that.simulateIntersection = function(daysFromCataclysm) {
        return simulateIntersection(daysFromCataclysm);
    };
	
	that.test = function() { calcMoonPhases(); };

    return that;
};