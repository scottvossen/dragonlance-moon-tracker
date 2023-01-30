var Dyceware = Dyceware || { };
Dyceware.MoonCalendar = Dyceware.MoonCalendar || { };

Dyceware.MoonCalendar.DAL = function(options) {

    var options = options || {
        serviceUrl: 'https://dl-moon-tracker.azure-mobile.net/',
        serviceKey: 'CJJNYXhiDeqYrndfMfbUuEYiozNWzc73',
        campaignTable: 'campaign',
        campaignName: 'Evil Campaign'
    };
    
    var that = { };

    function getMoonData(callback) {

        $.ajax({
            type: "GET",
            url: 'data/moons.json',
            dataType: "json",
            success: function(results, status, xhr) {
                callback({ 
                    data: results
                });
            },
            error: function(xhr, status, error) {
                callback({
                    xhr: xhr,
                    status: status,
                    error: error
                })
            }
        });
    }

    function getPhaseData(callback) {

        $.ajax({
            type: "GET",
            url: 'data/phases.json',
            dataType: "json",
            success: function(results, status, xhr) {
                callback({ 
                    data: results
                });
            },
            error: function(xhr, status, error) {
                callback({
                    xhr: xhr,
                    status: status,
                    error: error
                })
            }
        });
    }

    function getCampaignData(successCallback, errorCallback) {

        var MobileServiceClient = WindowsAzure.MobileServiceClient;
        var client = new MobileServiceClient(options.serviceUrl, options.serviceKey);
        var campaignTable = client.getTable(options.campaignTable);

        var query = campaignTable.where({
                name: options.campaignName
            })
            .read()
            .done(function (results) {
                successCallback(results);
            }, function (err) {
                errorCallback(err);
            });
    }

    function getCampaignData_HTTP(successCallback, errorCallback) {
        
        $.ajax({
            dataType: "json",
            url: options.serviceUrl + 'tables/campaign/',
            data: { },
            success: function(results, status, xhr) {
                successCallback(results);
            },
            error: function(xhr, status, error) {
                errorCallback(xhr, status, error);
            }
        });
    }

    function saveCampaignData(campaignData, successCallback, errorCallback) {

        var MobileServiceClient = WindowsAzure.MobileServiceClient;
        var client = new MobileServiceClient(options.serviceUrl, options.serviceKey);
        var campaignTable = client.getTable(options.campaignTable);

        campaignTable.update(campaignData)
            .done(function (results) {
                successCallback(results);
            }, function (err) {
                errorCallback(err);
            });
    }

    function setCampaignName(name) {
        this.options.campaignName = name;
    }

    // ================================
    // -====== Public Interface ======-
    // ================================
    that.getCampaignData = function(successCallback, errorCallback) {
        getCampaignData(successCallback, errorCallback);
    }

    that.getMoonData = function(callback) {
        getMoonData(callback);
    }

    that.getPhaseData = function(callback) {
        getPhaseData(callback);
    }
    that.saveCampaignData = function(campaignData, successCallback, errorCallback) {
        saveCampaignData(campaignData, successCallback, errorCallback);
    }

    that.setCampaignName = function(name) {
        setCampaignName(name);
    }

    return that;
};