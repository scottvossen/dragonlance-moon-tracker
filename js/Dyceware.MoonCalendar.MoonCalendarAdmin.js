var Dyceware = Dyceware || { };
Dyceware.MoonCalendar = Dyceware.MoonCalendar || { };

// manages moon calendar objects and events
Dyceware.MoonCalendar.MoonCalendarAdmin = function(options) {

    var options = options || { };
    this.viewModel = options.viewModel || { };
    this.isLoaded = false;
    this.$container = $(options.container ? options.container : '.moon-tracker-container');
    
    // calendar objects
    this.moons = options.moons;
    this.phases = options.phases;
    this.dateTracker = new Dyceware.MoonCalendar.DateTracker({ date: moment(options.campaign.date, "MM-DD-YYYY"), debug : options.debug });
    this.moonCalendar = new Dyceware.MoonCalendar.MoonCalendar({ moons : this.moons, phases : this.phases, debug : options.debug, width : this.$container.width(), height : this.$container.width() });
    this.alignmentBonusValues = options.alignmentBonusValues || {
        'Lunitari,Nuitari' : { savingThrow : 1, additionalSpells : 1, effectiveLevel : 1 },
        'Lunitari,Solinari' : { savingThrow : 1, additionalSpells : 1, effectiveLevel : 1 },
        'Nuitari,Solinari' : { savingThrow : 1, additionalSpells : 0, effectiveLevel : 0 },
        'Lunitari,Nuitari,Solinari' : { savingThrow : 2, additionalSpells : 2, effectiveLevel : 1 }
    };
    this.phaseBonusValues = options.alignmentBonusValues || {
        'High Sanction' : { savingThrow : 1, additionalSpells : 2, effectiveLevel : 1 },
        'Waning' : { savingThrow : 0, additionalSpells : 0, effectiveLevel : 0 },
        'Low Sanction' : { savingThrow : -1, additionalSpells : 0, effectiveLevel : -1 },
        'Waxing' : { savingThrow : 0, additionalSpells : 1, effectiveLevel : 0 }
    };

    // ui elements
    this.$progress = options.progress ? $(options.progress) : $("#progress");
    this.$regress = options.regress ? $(options.regress) : $("#regress");
    this.$progressFast = options.progressFast ? $(options.progressFast) : $("#progress-fast");
    this.$regressFast = options.regressFast ? $(options.regressFast) : $("#regress-fast");
    this.$datePicker = options.datePicker ? $(options.datePicker) : $("#datetimepicker");

    // events
    $(this.dateTracker).on("dateChange", this.dateChanged.bind(this));
    $(this.moonCalendar).on("intersection", this.onIntersection.bind(this));
    this.$progress.click(function () { this.advanceDays(1); }.bind(this));
    this.$regress.click(function () { this.advanceDays(-1) }.bind(this));
    this.$progressFast.click(function () { this.advanceDays(7); }.bind(this));
    this.$regressFast.click(function () { this.advanceDays(-7); }.bind(this));
    this.$datePicker.on("dp.change", this.pickDate.bind(this));
    $(window).on("resize", this.resizeCalendar.bind(this));
};

$.extend(Dyceware.MoonCalendar.MoonCalendarAdmin.prototype, {
    advanceDays : function(days) {
        this.dateTracker.daysFromZero(this.dateTracker.daysFromZero() + days);
    },
    calculateMoonAlignmentEffects : function(bonuses) {

        var intersections = this.viewModel.details.present.intersections();
        if (intersections.length >= 3) {
            var nightOfEye = _.union(intersections[0], intersections[1], intersections[2]);
            intersections = [nightOfEye];
        }

        for (var i = 0; i < intersections.length; i++) {
            var intersectionKey = intersections[i].sort().join();

            for (var j = 0; j < intersections[i].length; j++) {
                var robe = this.getRobeFromMoon(intersections[i][j]);
                var alignBonuses = this.alignmentBonusValues[intersectionKey] || { savingThrow : 0, additionalSpells : 1, effectiveLevel : 0 };

                bonuses[robe].savingThrow = bonuses[robe].savingThrow + alignBonuses.savingThrow;
                bonuses[robe].additionalSpells = bonuses[robe].additionalSpells + alignBonuses.additionalSpells;
                bonuses[robe].effectiveLevel = bonuses[robe].effectiveLevel + alignBonuses.effectiveLevel;
            }
        }

        return bonuses;
    },
    calculateMoonPhaseEffects : function(bonuses) {

        var phases = this.viewModel.details.present.phases();

        for (var i = 0; i < phases.length; i++) {
            var robe = phases[i].moon.robe;
            var phase = phases[i].phase;
            var phaseBonuses = this.phaseBonusValues[phase] || { savingThrow : 0, additionalSpells : 1, effectiveLevel : 0 };

            bonuses[robe].savingThrow = bonuses[robe].savingThrow + phaseBonuses.savingThrow;
            bonuses[robe].additionalSpells = bonuses[robe].additionalSpells + phaseBonuses.additionalSpells;
            bonuses[robe].effectiveLevel = bonuses[robe].effectiveLevel + phaseBonuses.effectiveLevel;
        }

        return bonuses;
    },
    calculateBonuses : function() {
        var bonuses = {
            white : { savingThrow : 0, additionalSpells : 0, effectiveLevel : 0 },
            red : { savingThrow : 0, additionalSpells : 0, effectiveLevel : 0 },
            black : { savingThrow : 0, additionalSpells : 0, effectiveLevel : 0 },
        };
        this.calculateMoonAlignmentEffects(bonuses);
        this.calculateMoonPhaseEffects(bonuses);

        this.viewModel.details.bonuses.white.savingThrow(bonuses.white.savingThrow);
        this.viewModel.details.bonuses.white.additionalSpells(bonuses.white.additionalSpells);
        this.viewModel.details.bonuses.white.effectiveLevel(bonuses.white.effectiveLevel);

        this.viewModel.details.bonuses.red.savingThrow(bonuses.red.savingThrow);
        this.viewModel.details.bonuses.red.additionalSpells(bonuses.red.additionalSpells);
        this.viewModel.details.bonuses.red.effectiveLevel(bonuses.red.effectiveLevel);

        this.viewModel.details.bonuses.black.savingThrow(bonuses.black.savingThrow);
        this.viewModel.details.bonuses.black.additionalSpells(bonuses.black.additionalSpells);
        this.viewModel.details.bonuses.black.effectiveLevel(bonuses.black.effectiveLevel);
    },
    dateChanged : function(e, data) {
        // set datepicker
        var moonDate = this.dateTracker.date().format('MM-DD-YYYY');
        this.$datePicker.data("DateTimePicker").setDate(moonDate);

        this.draw();
        this.calculateBonuses();
        this.simulatePast();
        this.simulateFuture();
        this.simulateNightOfTheEye();
    },
    draw : function() {
        if (!this.isLoaded) {
            this.initializeDateInput();
            this.initializeViewModel();
            this.isLoaded = true;
        }

        var dateString = this.dateTracker.formatDate(this.dateTracker.date());
        this.moonCalendar.displayDate(dateString);
        this.moonCalendar.draw(this.dateTracker.daysFromZero());
    },
    getRobeFromMoon : function(moonName) {
        for (var i = 0; i < this.moons.length; i++) {
            if (this.moons[i].name == moonName) {
                return this.moons[i].robe;
            }
        };
    },
    getMoonFromRobe : function(robe) {
        for (var i = 0; i < this.moons.length; i++) {
            if (this.moons[i].robe == robe) {
                return this.moons[i].name;
            }
        };
    },
    initializeDateInput : function() {
        var zeroTime = this.dateTracker.zeroTime().format('MM-DD-YYYY');
        var moonDate = this.dateTracker.date().format('MM-DD-YYYY');

        this.$datePicker.datetimepicker({
            pickTime: false,
            minDate: zeroTime
        });
        this.$datePicker.data("DateTimePicker").setDate(moonDate);
    },
    initializeViewModel : function() {

        this.viewModel.details = { };
        this.viewModel.details.present = {
            date : this.dateTracker.displayDate,
            hasIntersections : this.moonCalendar.hasIntersections,
            intersections: this.moonCalendar.intersections,
            phases : this.moonCalendar.phases
        };
        this.viewModel.details.past = ko.observable([]);
        this.viewModel.details.future = ko.observable([]);
        this.viewModel.details.nightOfTheEye = ko.observable({});
        this.viewModel.details.bonuses = {
            white : {
                savingThrow : ko.observable(0),
                additionalSpells : ko.observable(0),
                effectiveLevel : ko.observable(0),
            },
            red : {
                savingThrow : ko.observable(0),
                additionalSpells : ko.observable(0),
                effectiveLevel : ko.observable(0),
            },
            black : {
                savingThrow : ko.observable(0),
                additionalSpells : ko.observable(0),
                effectiveLevel : ko.observable(0),
            },
        };

        this.simulatePast();
        this.simulateFuture();
        this.simulateNightOfTheEye();
        this.calculateBonuses();
    },
    logIntersection : function(e, data) {
        if (data.intersections.length == 1) {
            console.log("on day " + this.dateTracker.daysFromZero() + ", there was one alignment.", data.intersections);
        }
        if (data.intersections.length == 2) {
            console.log("on day " + this.dateTracker.daysFromZero() + ", there were two alignments!", data.intersections);
        }
        if (data.intersections.length >= 3) {
            console.log("on day " + this.dateTracker.daysFromZero() + ", the night of the eye occured!!", data.intersections);
        }
    },
    onIntersection : function(e, data) {
        this.logIntersection(e, data);
    },
    pickDate : function(e) {
        this.dateTracker.date(moment(e.date));
    },
    resizeCalendar : function(e) {        
        this.moonCalendar.resize({ width : this.$container.width(), height : this.$container.width() });
    },
    simulateIntersections : function(options) {
        options = options || {
            numberToFetch : 1,
            requiredIntersections : 1,
            increment : 1
        };
        var intersections = [];
        var daysFromZero = this.dateTracker.daysFromZero();

        while(intersections != null && intersections.length < options.numberToFetch) {
            daysFromZero += options.increment;

            // can't go before cataclysm
            if (daysFromZero < 0) {
                return intersections;
            }
            
            var results = this.moonCalendar.simulateIntersection(daysFromZero);

            if (results != null && results.length >= options.requiredIntersections) {
                var date = this.dateTracker.daysFromZeroToDate(daysFromZero);

                intersections.push({ 
                    date : this.dateTracker.formatDate(date),
                    intersections : results
                });
            }
        }

        return intersections;
    },
    simulateFuture : function() {
        this.viewModel.details.future(this.simulateIntersections({
            numberToFetch : 3,
            requiredIntersections : 1,
            increment : 1
        }));
    },
    simulatePast : function() {
        this.viewModel.details.past(this.simulateIntersections({
            numberToFetch : 3,
            requiredIntersections : 1,
            increment : -1
        }));
    },
    simulateNightOfTheEye : function() {
        var nightOfTheEye = this.simulateIntersections({
            numberToFetch : 1,
            requiredIntersections : 3,
            increment : 1
        });
        this.viewModel.details.nightOfTheEye(nightOfTheEye[0].date);        
    }
});