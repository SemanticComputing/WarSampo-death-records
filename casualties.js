///////////////////////
//WIDGET FUNCTIONALITY

//Global variables for facet that define the state of the system

var callBack=function() { buildWidget(this, initSort); }
var callBackNull=function() { buildWidget(this, null); }

var GENDER = "";     // Selected URI
var GENDER_STR = ""; // Input string

var MARITALSTATUS = "";
var MARITALSTATUS_STR = "";

var NAME = "";
var NAME_STR = "";

var CHILDREN = "";
var CHILDREN_STR = "";

var NATIONALITY = "";
var NATIONALITY_STR = "";

var ARTICLE = "";

var RANK = "";
var RANK_STR = "";

var UNIT = "";
var UNIT_STR = "";

function initSort() {
    $("table").tablesorter(
            // sort on the first column and third column, order asc
            {sortList: [[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0]]}

            );
    //console.log("inited")
    //updateCarosel();
}

function getRequests() {
    var s1 = location.search.substring(1, location.search.length).split('&'),
        r = {}, s2, i;
    for (i = 0; i < s1.length; i += 1) {
        s2 = s1[i].split('=');
        r[decodeURIComponent(s2[0]).toLowerCase()] = decodeURIComponent(s2[1]);
    }
    return r;
};


$(document).ready(function() {
    $('#nav').load("/page-templates/navbar-fi.html");
    $('#footer').load("/page-templates/footer.html");
    $('.facet').hide();
    // call the tablesorter plugin
    $( ".facet-button" ).click(function() {
        // Class name for facet fields = id for facet header
        facetclass = "." + this.id;
        if ($(facetclass).is(':visible')) {
            $(facetclass).slideUp();
        }
        else {
            //$(facetclass + " select option.class-hierarchy[id*='.']").hide();
            $(facetclass).slideDown();
        }
    });
    //http://nominatim.openstreetmap.org/search.php?q=
    //window.setTimeout(function() {
    //	initSort();
    //},2000);

    $('.ohje-facet').show();
    $('.maritalstatus-facet').show();

    var QueryString = getRequests();

    //Get facet configs from uri

    // name query string
    var strName = QueryString["name"];
    if (strName != undefined && strName != null) {
        NAME = strName;
        NAME_STR = createNameRegex(NAME);
        $("#nameInput").css("background-color", "LightBlue");
        $("#nameInput").val(NAME);
    }

    //maritalstatus query string
    var strMaritalstatus=QueryString["maritalstatus"];
    if (strMaritalstatus != undefined && strMaritalstatus != null) {
        MARITALSTATUS_STR=strMaritalstatus;
    }

    //gender query string
    var strGender=QueryString["gender"];
    if (strGender != undefined && strGender != null) {
        GENDER_STR=strGender;
    }

    //nationality query string
    var strNationality=QueryString["nationality"];
    if (strNationality != undefined && strNationality != null) {
        NATIONALITY_STR=strNationality;
    }

    //CHILDREN query string
    var strCHILDREN = QueryString["CHILDREN"];
    if (strCHILDREN != undefined && strCHILDREN != null) {
        CHILDREN_STR = strCHILDREN;
    }

    //gender uri
    var strGenderURI=QueryString["genderuri"];
    if (strGenderURI != undefined && strGenderURI != null) {
        GENDER=strGenderURI;
    }

    //maritalstatus uri
    var strMaritalstatusURI = QueryString["maritalstatusuri"];
    if (strMaritalstatusURI != undefined && strMaritalstatusURI != null && strMaritalstatusURI.length > 0) {
        MARITALSTATUS = strMaritalstatusURI;
    }

    //nationality uri
    var strNationalityURI=QueryString["nationalityuri"];
    if (strNationalityURI != undefined && strNationalityURI != null && strNationalityURI.length > 0) {
        NATIONALITY=strNationalityURI;
    }

    //CHILDREN uri
    var strCHILDRENURI=QueryString["childrenuri"];
    if (strCHILDRENURI != undefined && strCHILDRENURI != null && strCHILDRENURI.length > 0) {
        CHILDREN=strCHILDRENURI;
    }

    //article query
    var strArticleURI=QueryString["uri"];
    if (strArticleURI != undefined && strArticleURI != null && strArticleURI.length > 0) {
        ARTICLE=strArticleURI;
        queryArticleInfo();
    }

    //rank query
    var strRankURI=QueryString["rankuri"];
    if (strRankURI != undefined && strRankURI != null && strRankURI.length > 0) {
        RANK=strRankURI;
    }

    //unit query
    var strUnitURI=QueryString["unituri"];
    if (strUnitURI != undefined && strUnitURI != null && strUnitURI.length > 0) {
        UNIT=strUnitURI;
    }
});

//Add params to url
function addParameterToURL(param){
    _url = location.href;
    _url += (_url.split('?')[1] ? '&':'?') + param;
    return _url;
}


/////////////////////////
// GENERIC HELP FUNCTIONS

function enoughInput (n, id) { // Tru if input element 'id' contains more than n chars
    //alert(element.attr("value"));
    var str = document.getElementById(id).value;
    if (str.length>=n && str.charAt(0)!='*')
        return true;
    else return false;
}

function isURI (str) { // Check is str is a uri
    if (str.indexOf("http://") == -1)  return false;
    else return true;
}

function valueRegex(uri) { //  Return blank node for empy uri, otherwise uri
    return valueRegex2('[]',uri);
}

function valueRegex2(label, uri) { //  Return blank node for empy uri, otherwise uri
    if (emptyValue(uri) || equalString(uri,"NONE"))
        return label;
    else if (isURI(uri)) return "<" + uri + ">";
    else return label; // Autocomptelete string
}

function indent(level) {
    level = level.split(".");
    //console.log(level.length);
    if (level.length == 1)
        return "";
    var result="";
    for (var i=1; i<level.length; i++) {
        result += "--";
    }
    return result;
}

function OpenInNewTab(url) {
    var win = window.open(url, '_blank');
    win.focus();
}

///////////////////////
// WIDGET FUNCTIONALITY

// Functionality of facet widgets

function setKeyActions () {
    $("#nameInput").keyup(function(event){
    if(event.keyCode == 13){
        var nameInputValue = document.getElementById("nameInput").value;
        if (nameInputValue) {
            NAME = nameInputValue;
            $("#nameInput").css("background-color","LightBlue");
            }
        else {
            $("#nameInput").css("background-color","White");
            }
        }
    });

    $("#maritalstatusInput").keyup(function(){
        if (enoughInput (0,"maritalstatusInput")) {
            MARITALSTATUS_STR =  document.getElementById("maritalstatusInput").value;
            $("#maritalstatusInput").css("background-color","LightBlue");
            $("#maritalstatusSelector").each(callBack);
        }
        else {
            $("#maritalstatusInput").css("background-color","LightPink");
        }
    });

    // Gender selector
    $("#genderInput").keyup(function(){
        if (enoughInput (0,"genderInput")) {
            GENDER_STR =  document.getElementById("genderInput").value;
            $("#genderInput").css("background-color"," LightBlue");
            $("#genderSelector").each(callBack);
        }
        else {
            $("#genderInput").css("background-color","LightPink");
        }
    });

    $("#childrenInput").keyup(function(){
        if (enoughInput (0,"childrenInput")) {
            CHILDREN_STR =  document.getElementById("childrenInput").value;
            $("#childrenInput").css("background-color","LightBlue");
            $("#childrenSelector").each(callBack);
        }
        else {
            $("#childrenInput").css("background-color","LightPink");
        }
    });

    $("#nationalityInput").keyup(function(){
        if (enoughInput (0,"nationalityInput")) {
            NATIONALITY_STR =  document.getElementById("nationalityInput").value;
            $("#nationalityInput").css("background-color","LightBlue");
            $("#nationalitySelector").each(callBack);
        }
        else {
            $("#nationalityInput").css("background-color","LightPink");
        }
    });

    $("#rankInput").keyup(function(){
        if (enoughInput (0,"rankInput")) {
            RANK_STR =  document.getElementById("rankInput").value;
            $("#rankInput").css("background-color","LightBlue");
            $("#rankSelector").each(callBack);
        }
        else {
            $("#rankInput").css("background-color","LightPink");
        }
    });

    $("#unitInput").keyup(function(){
        if (enoughInput (0,"unitInput")) {
            UNIT_STR =  document.getElementById("unitInput").value;
            $("#unitInput").css("background-color","LightBlue");
            $("#unitSelector").each(callBack);
        }
        else {
            $("#unitInput").css("background-color","LightPink");
        }
    });

}

function createNameRegex(value) {
    return (value) ? '(^|^.* )' + value + '.*$' : "";
}


// WIDGET UPDATE LOGIC AFTER A CHANGE

// Change action for each widget

function updateNameSelection (value) { // After selection in a facet SELECT
    var nameInputValue = document.getElementById("nameInput").value;

    NAME = value;
    NAME_STR = createNameRegex(NAME);
    console.log(NAME_STR);
    updateResults();
    if (NAME.length > 0) {
        changeUrlParam("name", NAME);
    } else {
        if (window.location.href.indexOf("name") > 0) {
            removeURLParam("name");
        }
    }
}

function updateMaritalstatusSelection (value, id) { // After selection in a facet SELECT
    var maritalstatusInputValue = document.getElementById("maritalstatusInput").value;
    var input = $("#maritalstatusSELECT option:selected");

    var order = input.attr("id");
    var bool = input.is(":visible");

    //If you click main class and subclasses are hidden, this will open the subclasses, but not update selected value yet
    if(!bool && order.indexOf("_deselect") < 0 && maritalstatusInputValue == "") {
        $("#maritalstatusSELECT option:selected").removeAttr("selected");
        input.show();
        return;
    }

    //In case of clear selection
    if(order.indexOf("_deselect")>-1){
        value="";
        //changeUrlParam("maritalstatusuri", "");
    }

    MARITALSTATUS=value;
    console.log(MARITALSTATUS);
    MARITALSTATUS_STR='';
    document.getElementById("maritalstatusInput").value="";
    updateResults ();
    if(MARITALSTATUS.length>0){
        changeUrlParam("maritalstatusuri", MARITALSTATUS);
    } else {
        if (window.location.href.indexOf("maritalstatusuri") > 0) {
            removeURLParam("maritalstatusuri");
        }
    }
}

function updateRankSelection (value, id) { // After selection in a facet SELECT
    //var parts = value.split("|delimit|");
    //order = parts[0];
    //value = parts[1];
    //order = order.split(".")[0];
    var maritalstatusInputValue = document.getElementById("rankInput").value;
    var input = $("#rankSELECT option:selected");
    console.log(input);
    var order = input.attr("id");
    var bool = input.is(":visible");

    //If you click main class and subclasses are hidden, this will open the subclasses, but not update selected value yet
    if(!bool && order.indexOf("_deselect") < 0 && maritalstatusInputValue == "") {
        $("#rankSELECT option:selected").removeAttr("selected");
        input.show();
        return;
    }
    //In case of clear selection
    if(order.indexOf("_deselect")>-1){
        value="";
        changeUrlParam("rankuri", "");
    }
    RANK=value;
    console.log(MARITALSTATUS);
    RANK_STR='';
    document.getElementById("rankInput").value="";
    updateResults ();
    if(RANK.length>0){
        changeUrlParam("rankuri", RANK);
    } else {
        if (window.location.href.indexOf("rankuri") > 0) {
            removeURLParam("rankuri");
        }
    }
}

function updateUnitSelection(value, id){
    var unitInputValue = document.getElementById("unitInput").value;
    var input = $("#unitSELECT option:selected");

    var order = input.attr("id");
    var bool = input.is(":visible");

    //If you click main class and subclasses are hidden, this will open the subclasses, but not update selected value yet
    if(!bool && order.indexOf("_deselect") < 0 && unitInputValue == "") {
        $("#unitSELECT option:selected").removeAttr("selected");
        input.show();
        return;
    }

    //In case of clear selection
    if(order.indexOf("_deselect")>-1){
        value="";
        changeUrlParam("unituri", "");
    }
    UNIT=value;
    console.log(UNIT);
    UNIT_STR='';
    document.getElementById("unitInput").value="";
    updateResults ();
    if(UNIT.length>0){
        changeUrlParam("unituri", UNIT);
    } else {
        if (window.location.href.indexOf("unituri") > 0) {
            removeURLParam("unituri");
        }
    }
}

function updateGenderSelection (value,id) { // After seletion from facet SELECT
    GENDER=value;
    GENDER_STR='';
    document.getElementById("genderInput").value="";
    updateResults ();
    console.log(GENDER);
    if(GENDER.length>0){
        changeUrlParam("genderuri", encodeURIComponent(GENDER));
        //window.location.search = jQuery.query.set("genderuri", GENDER);
    } else {
        if (window.location.href.indexOf("genderuri") > 0) {
            console.log(window.location.href);
            removeURLParam("genderuri");
        }
    }
}

function updatechildrenSelection (value) { // After seletion from facet SELECT
    //var parts = value.split("|delimit|");
    //order = parts[0];
    //value = parts[1];
    //order = order.split(".")[0];
    var input = $("#childrenSELECT option:selected");
    var order = input.attr("id");
    var childrenInputValue = document.getElementById("childrenInput").value;
    var bool = input.is(":visible");
    console.log(order);
    //If you click main class and subclasses are hidden, this will open the subclasses, but not update selected value yet
    if(!bool && order.indexOf("_deselect") < 0 && childrenInputValue == "") {
        console.log("close facet");
        $("#childrenSELECT option:selected").removeAttr("selected");
        input.show();
        return;
    }

    //In case of clear selection
    if(order.indexOf("_deselect")>-1){
        value="";
        removeURLParam("childrenuri");
    }
    CHILDREN=value;
    console.log(CHILDREN);
    CHILDREN_STR='';
    document.getElementById("childrenInput").value="";
    updateResults ();
    if(CHILDREN.length>0){
        changeUrlParam("childrenuri", CHILDREN);
        //window.location.search = jQuery.query.set("childrenuri", CHILDREN);
    } else {
        if (window.location.href.indexOf("childrenuri") > 0) {
            removeURLParam("childrenuri");
        }
    }
}

function updateNationalitySelection (value,id) { // After seletion from facet SELECT
    NATIONALITY=value;
    NATIONALITY_STR='';
    document.getElementById("nationalityInput").value="";
    updateResults ();
    if(NATIONALITY.length>0){
        changeUrlParam("nationalityuri", encodeURIComponent(NATIONALITY));
        //window.location.search = jQuery.query.set("nationalityuri", NATIONALITY);
    } else {
        if (window.location.href.indexOf("nationalityuri") > 0) {
            removeURLParam("nationalityuri");
        }
    }
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

/*
 * Removing given url parameter
 */
function removeURLParam(param){
    var currentURL = window.location.href
        var index = currentURL.indexOf(param);
    if(index > 0){
        var urllen =currentURL.length;
        var endUrl = currentURL.substring(index, urllen);
        var endtag = index+endUrl.indexOf('&');

        //Define url length
        if(endtag <= index){
            endtag = urllen;
        } else {
            endtag = endtag+1;
        }

        var substring = currentURL.substring(index, endtag);
        var newUrl = currentURL.replace(substring, "");
        var last=newUrl.substr(-1);

        //Remove extra ? or & symbol if -> last char
        if (last == '?' || last == '&'){
            newUrl = newUrl.substring(0, newUrl.length - 1);
        }

        try {
            if(history.pushState) {
                window.history.pushState('', '', newUrl );
            } else {
                console.log("Push state is not available");
            }
        } catch (e) {
            console.log(e);
        }
    }
}

function changeUrlParam (param, value) {
    var currentURL = window.location.href+'&';
    var change = new RegExp('('+param+')=(.*)&', 'g');
    var newURL = currentURL.replace(change, '$1='+value+'&');

    if (getURLParameter(param) !== null){
        try {
            window.history.replaceState('', '', newURL.slice(0, - 1) );
        } catch (e) {
            console.log(e);
        }
    } else {
        var currURL = window.location.href;
        if (currURL.indexOf("?") !== -1){
            window.history.replaceState('', '', currentURL.slice(0, - 1) + '&' + param + '=' + value);
        } else {
            window.history.replaceState('', '', currentURL.slice(0, - 1) + '?' + param + '=' + value);
        }
    }
}

function clearAllSelections() {
    value = "";
    NAME = "";
    MARITALSTATUS = "";
    MARITALSTATUS_STR = "";
    GENDER = "";
    GENDER_STR = "";
    NATIONALITY = "";
    NATIONALITY_STR = "";
    CHILDREN = "";
    CHILDREN_STR = "";
    RANK = "";
    RANK_STR = "";
    UNIT = "";
    UNIT_STR = "";

    document.getElementById("nameInput").value="";
    document.getElementById("maritalstatusInput").value="";
    document.getElementById("nationalityInput").value="";
    document.getElementById("childrenInput").value="";
    document.getElementById("genderInput").value="";
    document.getElementById("rankInput").value="";
    document.getElementById("unitInput").value="";
    // window.location.href =  window.location.href.split("?")[0]
    console.log(window.location.href);
}

function clearUnselectedURLParams(){
    if(window.location.href.indexOf('?')>0){
        var paramsStr = window.location.href.split("?")[1];
        var params=null;
        if(paramsStr.indexOf('&')>0){
            params = paramsStr.split("&");
        } else {
            params = [paramsStr];
        }

        var len = params.length;
        for(var i = 0; i<len;i++){
            var p = checkParamInURL(params[i]);
        }

    }
    var params = window.location.href =  window.location.href.split("?")[1];
}

function checkParamInURL(param){
    // TODO: Fix this to not use indexOf
    var paramName = "";
    if(param.indexOf("childrenuri")>0){
        paramName = CHILDREN;
    }
    if(param.indexOf("nationalityuri")>0){
        paramName = NATIONALITY;
    }
    if(param.indexOf("genderuri")>0){
        paramName = GENDER;
    }
    if(param.indexOf("name") > 0){
        paramName = NAME;
    }
    if(param.indexOf("maritalstatusuri")>0){
        paramName = MARITALSTATUS;
    }
    return paramName;
}

function updateResults () {
    // First build result for creating count index; this will re-create facets, too
    $("#resultDisplay").each(callBack);
    $("#genderSelector").each(callBack);
    $("#maritalstatusSelector").each(callBack);
    $("#childrenSelector").each(callBack);
    $("#nationalitySelector").each(callBack);
    $("#rankSelector").each(callBack);
    $("#unitSelector").each(callBack);
}
function zeroPad(num, nationalitys) {
    var zero = nationalitys - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}

function printQuestionMark(){
    return '?';
}

/* Initialize */

$(document).ready(setKeyActions);

$(document).ready(updateResults);
