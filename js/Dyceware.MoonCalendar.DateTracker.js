var Dyceware = Dyceware || { };
Dyceware.MoonCalendar = Dyceware.MoonCalendar || { };

Dyceware.MoonCalendar.DateTracker = function(options) {

    var options = options || { };
    var that = { };
    
    var zeroTime = options.zeroTime || moment("1-1-2000", "MM-DD-YYYY");
    var date = options.date || zeroTime.clone();
    var displayFormat = options.displayFormat || 'dddd, MMM DD YY';

    // ================================
    // -====== Public Interface ======-
    // ================================
    that.date = function(value) {

        // get context
        if (value === undefined) {
            return date;
        }

        // set context
        if (moment.isMoment(value)) {
            var newDate = (value >= zeroTime) ? value : zeroTime;

            if(date.diff(newDate, 'days') != 0) {
                var oldDate = date;
                date = newDate;
                that.displayDate(that.formatDate(date));
                $(that).trigger("dateChange", { value: date, previous: oldDate });
            }

            return that;
        }

        // bad input
        return undefined;

    };

    that.daysFromZero = function(value) {

        // get context
        if (value === undefined) {
            return date.diff(zeroTime, "days");
            // return moment.duration(date.diff(zeroTime)).days();
        }

        // set context
        if (value == parseInt(value)) {
            that.date(that.daysFromZeroToDate(value));
            return that;
        }

        // bad input
        return undefined;
    };

    that.daysFromZeroToDate = function(daysFromZero) {
        var newDate = zeroTime.clone();
        newDate.add('days', (daysFromZero >= 0) ? daysFromZero : 0);
        return newDate;
    };

    that.formatDate = function(value) {
        return value.format(displayFormat);
    };

    that.zeroTime = function(value) {

        // get context
        if (value === undefined) {
            return zeroTime;
        }

        // set context
        if (moment.isMoment(value)) {
            zeroTime = value;
            return that;
        }

        // bad input
        return undefined;
    };

    that.displayDate = ko.observable(that.formatDate(date));

    return that;
};