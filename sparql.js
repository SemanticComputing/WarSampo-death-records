/*  SPARQL WIDGET JS LIBRARY
    By Eero Hyvönen, SeCo Group, Aalto University
    http://www.seco.tkk.fi
    MIT License 
    */

/* HELP FUNCTIONS */

var RESULT = null; // Latest SPARQL result in JSON

function stringify(json) {
    return JSON.stringify(json);
}

function getElementAttributeValue(id,attr) {
    var e = document.getElementById(id);
    if (e==null) {
        alert("Error in getElementAttributeValue: \nid=" + id + ",  attr=" +attr + " (id not known)");
        return "";
    }
    else return document.getElementById(id).getAttribute(attr) ;
}

function setElementAttributeValue(id,attr,value) {
    document.getElementById(id).setAttribute(attr,value) ;
}

function createLink(name,url) {
    return '<a href="' + url + '">' + name + '</a>';
}

function emptyValue (value){
    if (value=="" || value==null || value==undefined) { 
        return true; 
    }
    else {
        return false;
    }
}

function equalString(s1, s2) {
    if (s1.length!=s2.length) return false;
    for (var i=0 ; i<s1.length; i++) {
        if (s1[i]!=s2[i]) return false;
    }
    return true;
}

/**********************  WIDGET CREATOR **********************/

function substituteEvalParts(query, sep) { // Evaluate escaped query parts !expr! -> eval(expr)
    var arr = query.split(sep);
    var len = arr.length;
    // alert(JSON.stringify(arr) + "\nLEN=" + len);
    var i = 1;
    while (len>i) {
        var v = sep + arr[i] + sep;
        var val = eval(arr[i]);
        query=query.replace(v,val); // !expr! -> eval(expr)
        // alert("\n Subst: " + v + ":\t" +val + "\nWhere arr[i] = " + arr[i] + ", i =" + i);
        i=i+2;
    }
    // alert(query);
    //alert("");
    return query;
}

function buildWidget (elem, callback) {
    // Widget creator

    var elem = $(elem);
    var separator = elem.attr("separator");

    if (emptyValue(separator))
        separator = "!";  // Default separator "!"

    var title= elem.attr("title");
    if (!emptyValue(title)) {
        title = substituteEvalParts(title,separator);
        elem.attr("title", function(n,v) {return title;});
        title = '<h1>' + title + '</h1>';
    }
    else title = "";

    var pattern = elem.attr("pattern");
    var sparqlEndpoint = elem.attr("sparql-endpoint");
    var query = elem.attr("query").trim();
    if (query.match(/(select|prefix|describe)/i)==null)  {// Javascript can be used as a query attribute, e.g., a variable name
        query=eval(query);
    }
    else {
        query=substituteEvalParts(query,separator);
    }
    query=encodeURIComponent(query);

    // HTML code before and after elements
    var pre = elem.attr("header");
    if (emptyValue(pre)) pre = "";
    pre=substituteEvalParts(pre,separator);

    var post = elem.attr("footer");
    if (emptyValue(post)) post = "";
    post=substituteEvalParts(post,separator);

    var createIndex;
    var facet = elem.attr("facet"); // Index facets
    if (emptyValue(facet)) createIndex = false;
    else createIndex = true;

    var getArg = sparqlEndpoint + "?query=" + query + '&format=json' ;
    $.get(getArg, function(result) {
        RESULT = result;
        var INDEX = null;
        var count = null;
        var indexObject = null;
        $(this).data('sparqlResult',result); // Save result in the element

        if (result.results!=null) { // Non-empty result
            var bindings = result.results.bindings;
            var vars = result.head.vars;
            var divList = "";
            if (createIndex) {
                INDEX = new Object ();
                for (var i = 0; i<vars.length; i++) {
                    INDEX[vars[i]]= new Object ();;
                }
            }
            for (var i = 0; i<bindings.length; i++) {
                var newPattern = pattern;
                var b = bindings[i];

                for (var j = 0; j<vars.length; j++) {
                    var v = vars[j];
                    var val = null;
                    if (b[v]==null) val="";  // Missing value for variable in a binding
                    else val = b[v].value;   // var value in binding
                    var expr = "\\?" + v;
                    var sv = new RegExp(expr, "g");
                    newPattern = newPattern.replace(sv,val); // replace ?var with its value
                    if (createIndex) {
                        count = INDEX[vars[j]][val];
                        if (count==null) INDEX[vars[j]][val]=1;
                        else INDEX[vars[j]][val]++;
                    }
                }

                newPattern=substituteEvalParts(newPattern, separator);
                var div = '<span class="sparqlWidgetItem">' + newPattern + '</span>';
                divList = divList + div;
            }
            if (createIndex) { // True for result component only
                $(this).attr("index",INDEX);

                eval('indexObject = ' + facet);
                for (var i = 0; i<vars.length; i++) {
                    var facetId = indexObject[vars[i]];
                    if (facetId!=null) { // Save indices in facet elements for computing counts
                        var fid = "#"+facetId;
                        $(fid).data('index',INDEX[vars[i]], function () {alert("INDEX DONE");});
                        $(fid).buildWidget;
                    }
                }

            }
            elem.html(title + pre + divList +post);
        }
        else {
            elem.html(title + '<div class="sparqlWidgetItem">' + "No results" + "</div>");
        }
        if(callback){
            callback();
        }
    },"jsonp"
    );
}


//Sparql query that returns one result, optimal for such usage
function sparqlQuery(query, sparqlEndpoint){
    var val = null;
    var getArg = sparqlEndpoint + "?query=" + query + '&format=json' ;
    $.get(getArg, function(result) {

        $(this).data('sparqlResult',result); // Save result in the element
        if (result.results!=null) { // Non-empty result
            var bindings = result.results.bindings;
            var vars = result.head.vars;

            for (var i = 0; i<bindings.length; i++) {
                var b = bindings[i];
                for (var j = 0; j<vars.length; j++) {
                    var v = vars[j];
                    if (b[v]==null) val="";  // Missing value for varible in a binding
                    else val = b[v].value;   // var value in binding
                }
            }
        }
        else {
            console.log("Bad URI");
        }
        redirectArticle(val);
    },"json"
    );

}
