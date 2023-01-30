(function($) {
    'use strict';
    
    var $loadingOverlay = $('#calendarLoadingOverlay');

    $(document).ready(function() {

        window.dyceware = { };
        dyceware.moonCalendar = { };

        // initialize data layer
        dyceware.moonCalendar.data = { };
        dyceware.moonCalendar.DAL = new Dyceware.MoonCalendar.DAL();
        dyceware.moonCalendar.data.viewModel = { };
        
        // load data async
        // dyceware.moonCalendar.DAL.getMoonData(loadMoons); // hosting limitations force manual loading
        // dyceware.moonCalendar.DAL.getPhaseData(loadPhases);
        dyceware.moonCalendar.data.moons = MoonCalendar.Moons;
        dyceware.moonCalendar.data.phases = MoonCalendar.Phases;

        $loadingOverlay.show();
        // Azure apparently is too slow so hard code the date
        // dyceware.moonCalendar.DAL.getCampaignData(loadCampaign);
        loadCampaign([{
            date: "5-31-2010",
            id: "28D2C427-52B7-4381-A7D6-DAC499F8254E",
            name: "Evil Campaign"
        }]);
    });

    var asyncLoaded = _.after(1, render);

    function loadCampaign(results) {
        if (results.error) {
            console.log(results.error);
        }
        dyceware.moonCalendar.data.campaign = results[0];
        asyncLoaded();
    }

    function loadMoons(results) {
        if (results.error) {
            console.log(results.error);
        }
        dyceware.moonCalendar.data.moons = results.data;
        asyncLoaded();
    }

    function loadPhases(results) {
        if (results.error) {
            console.log(results.error);
        }
        dyceware.moonCalendar.data.phases = results.data;
        asyncLoaded();
    }

    function render() {
        // initialize view
        dyceware.moonCalendar.moonCalendarAdmin = new Dyceware.MoonCalendar.MoonCalendarAdmin({
            container : ".moon-tracker-container",
            progress : "#progress",
            regress : "#regress",
            progressFast : "#progress-fast",
            regressFast : "#regress-fast",
            datePicker : "#datetimepicker",
            moons : dyceware.moonCalendar.data.moons,
            phases : dyceware.moonCalendar.data.phases,
            campaign : dyceware.moonCalendar.data.campaign,
            viewModel : dyceware.moonCalendar.data.viewModel
        });

        dyceware.moonCalendar.moonCalendarAdmin.draw();
        ko.applyBindings(dyceware.moonCalendar.data.viewModel);
        $loadingOverlay.hide();
    }

}(jQuery));