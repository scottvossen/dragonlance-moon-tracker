MoonCalendar = MoonCalendar || { };

MoonCalendar.MoonTrackerCanvasComponent = (function(options) {

    var options = options || { };
    var that = { };
    
    // moon canvas members
    var canvas = options.canvas || document.getElementById("moon-tracker");
    var $canvas = $(canvas);
    var height = $canvas.attr("height");
    var width = $canvas.attr("width");
    var outerRadius = Math.min(width * 0.9, height * 0.9) / 2;
    var rotation = 0;
    var center = {
        x: width / 2,
        y: height / 2,
    };

    // arc members
    var lineWidth = (outerRadius * 2) / 15;
    var lineSpacing = lineWidth / 4;
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = lineWidth;

    var dateTracker = MoonCalendar.dateTracker();
    var moons = buildMoons();
    
    function buildMoons() {
        
        var moons = [];
        for (var i = 0; i < MoonCalendar.Moons.length; i++) {
            // radius should get smaller for each new moon
            var newMoonRadius = outerRadius - ((i * lineWidth) + (i * lineSpacing));
            var newMoon = buildMoon(MoonCalendar.Moons[i], newMoonRadius);
            moons.push(newMoon);
        }
        return moons;
    }

    function buildMoon(moon, radius) {
        degreesPerSection = 360 / moon.daysPerCycle;
        bufferDegrees = 2;

        arcs = [];
        for (var i = 0; i < moon.daysPerCycle; i++) {
            arcs.push({
                cx: center.x,
                cy: center.y,
                radius: radius,
                startAngle: moon.radialOrigin + (i*degreesPerSection) + (bufferDegrees / 2),
                endAngle: moon.radialOrigin + (i+1)*degreesPerSection - (bufferDegrees / 2),
                color: (i == moon.position) ? moon.activeColor : moon.color
            });
        }

        moon.arcs = arcs;
        return moon;
    }

    function colorMoon(moon) {
        // refreshes the color for the moon based on the model data
        for (var i = 0; i < moon.arcs.length; i++) {
            moon.arcs[i].color = (i == moon.position) ? moon.activeColor : moon.color;
        }
    }

    function drawAll() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        for (var i = 0; i < moons.length; i++) {
            var moon = moons[i];
            colorMoon(moon);
            for (var j = 0; j < moon.arcs.length; j++) {
                draw(moon.arcs[j]);
            }
        }
    }

    function draw(arc) {
        ctx.save();
        ctx.translate(arc.cx, arc.cy);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.beginPath();
        // ctx.arc(0, 0, arc.radius, arc.startAngle * Math.PI / 180, arc.endAngle * Math.PI / 180);
        ctx.arc(0, 0, arc.radius, -1.0 * arc.startAngle * Math.PI / 180, -1.0 * arc.endAngle * Math.PI / 180, true);
        ctx.strokeStyle = arc.color;
        ctx.stroke();
        ctx.restore();
    }

    function checkIntersections() {

        var intersections = [];
        for (var i = 0; i < moons.length - 1; i++) {
            for (var j = i+1; j < moons.length; j++) {
                var moon1 = moons[i];
                var moon2 = moons[j];

                var activeArc1 = moon1.arcs[moon1.position];
                var activeArc2 = moon2.arcs[moon2.position];

                // check if the ranges overlap
                if (AtLeastHalfOverlap(activeArc1.startAngle, activeArc1.endAngle, activeArc2.startAngle, activeArc2.endAngle)) {
                    intersections.push([moons[i].name, moons[j].name]);
                }
            }
        }

        if (intersections.length > 0) {
            $(that).trigger("intersection", intersections);
        }
    }

    function AnyOverlap(x1, x2, y1, y2) {
        return Math.max(x1,y1) <= Math.min(x2,y2);
    }

    function AtLeastHalfOverlap(x1, x2, y1, y2) {
        // 50% or more overlap
        var midX = (x1 + x2) / 2;
        var midY = (y1 + y2) / 2;

        var midXInY = (midX >= y1) && (midX <= y2);
        var midYInX = (midY >= x1) && (midY <= x2);

        return midXInY || midYInX;
    }

    function rotate() {
        rotation += 90;
        drawAll();
    }

    function progressMoons() {
        dateTracker.daysFromCataclysm(dateTracker.daysFromCataclysm() + 1);

        for (var i = 0; i < moons.length; i++) {

            var currentPosition = moons[i].position;
            var nextPosition = currentPosition + 1 < moons[i].arcs.length ? currentPosition + 1 : 0;
            moons[i].position = nextPosition;
        }

        checkIntersections();
    }

    function regressMoons() {
        dateTracker.daysFromCataclysm(dateTracker.daysFromCataclysm() - 1);

        for (var i = 0; i < moons.length; i++) {

            var currentPosition = moons[i].position;
            var nextPosition = currentPosition - 1 >= 0 ? currentPosition - 1 : moons[i].arcs.length - 1;
            moons[i].position = nextPosition;
        }

        checkIntersections();
    }

    // public interface
    that.canvas = canvas;
    
    that.daysFromCataclysm = function() {
        return dateTracker.daysFromCataclysm();
    };
    
    that.cataclysm = function() {
        return dateTracker.displayDate(dateTracker.cataclysm());
    };

    that.date = function() {
        return dateTracker.displayDate(dateTracker.date());
    };

    that.progressMoons = function() {
        progressMoons();
        drawAll();
        return that;
    };

    that.regressMoons = function() {
        regressMoons();
        drawAll();
        return that;
    };
    
    that.rotate = function() {
        rotate();
        return that;
    };

    that.draw = function() {
        drawAll();
        return that;
    };

    return that;
})();