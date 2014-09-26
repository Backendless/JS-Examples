var APPLICATION_ID = '';
var SECRET_KEY = '';
var VERSION = 'v1';
var CATEGORY = 'geoservice_sample';

if (!APPLICATION_ID || !SECRET_KEY || !VERSION)
    alert("Missing application ID and secret key arguments. Login to Backendless Console, select your app and get the ID and key from the Manage > App Settings screen. Copy/paste the values into the Backendless.initApp call located in citysearch.js");


Backendless.initApp(APPLICATION_ID, SECRET_KEY, VERSION);

var $resultBlock;
var $thead;
var $tbody;
var $geoQuery;

$(function () {
    $('#radius-slider').slider({
        range: "min",
        value: 1,
        min: 1,
        max: 20000,
        slide: function (event, ui) {
            $("#radius-value").text(ui.value);
        }
    });

    $("#search-button").click(function () {
        searchGeoPoints();
    });

    $resultBlock = $('#result-block');
    $thead = $('#thead');
    $tbody = $('#tbody');

    $geoQuery = new BackendlessGeoQuery();
    $geoQuery.latitude = parseInt($('#latitude').text());
    $geoQuery.longitude = parseInt($('#longitude').text());
    $geoQuery.units = Backendless.Geo.UNITS.KILOMETERS;
    $geoQuery.categories.push(CATEGORY);

    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(applyLocation);
});

function applyLocation(position) {
    $('#latitude').text(position.coords.latitude);
    $geoQuery.latitude = position.coords.latitude;

    $('#longitude').text(position.coords.longitude);
    $geoQuery.longitude = position.coords.longitude;
}

function searchGeoPoints() {
    startLoading();

    $tbody.empty();
    $resultBlock.hide();

    $geoQuery.radius = $('#radius-value').text();
    Backendless.Geo.find($geoQuery, new Backendless.Async(onResult, onFault, this));
}

function onResult(result) {
    finishLoading();
    $resultBlock.show();

    if (!result.totalObjects) {
        $thead.hide();
        $tbody.append("<h3 style='text-align: center'>No geo points found</h3>");
        return;
    }

    $.each(result.data, function () {
        var cells = [
            "<td>" + this.metadata.city + "</td>", "<td>" + this.latitude + "</td>", "<td>" + this.longitude + "</td>"
        ];

        $thead.show();
        $tbody.append("<tr>" + cells.join('') + "</tr>");
    });
}

function onFault(fault) {
    finishLoading();
    alert(fault.message);
}

function startLoading() {
    $('#search-button').hide();
    $('#loader').show();
}

function finishLoading() {
    $('#search-button').show();
    $('#loader').hide();
}