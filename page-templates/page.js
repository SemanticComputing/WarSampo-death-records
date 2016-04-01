// These functions are defined for each perspective / page type): actors, events, ...
// To generate home pages:
// 1. Rewrite them for a new class of home pages of a perspective. warsampo.js functions can be used.
// 2. Add index.html homepage template in the same folder as it is (do not edit it).

// GENERIC FUNCTIONS TO BE DEFINED
function setPageHeader() {
	setElementInnerHTML("pageType", "Actors");
}
function setPageHeaderLink() {
	setElementInnerHTML("pageTypeURL", "http://www.sotasampo.fi/actors/");
}
function createDataContent(uri) {
	setElementInnerHTML("dataContent", "No data avalable");
}
function createLinkContent() {
	setElementInnerHTML("linkContent", "No links avalable");
}
function toFinnish() {
	setElementInnerHTML("title", "Sotasampo: toimijan kotisivu");
	setElementInnerHTML("pageType", "Toimijat");
	// Replace other English literals with Finnish 
}

// Main function to create page
function createPage() {
	setPageHeader();
	setPageHeaderLink();
	createDataContent();
	createLinkContent();
	if (getParameter('lan')=='fi') 
		toFinnish();	
}

// YOUR PERSPECTIVE SPECIFIC FUNCTIONS GO HERE 

// ...