/*******************************************************************************
*
*	@file sketch.js
*	@brief A quick sketch showing different methods of generating a convexhull
*
*******************************************************************************/

let controlPanel;

let resetButton;

/**
*	Enumeration of the different methods that can be used to split points when
*	using divide and conquer
*
*	@enum {String}
*/
const splitMethods = Object.freeze({
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical",
    RADIAL: "radial",
    ANGULAR: "angular"
});

let splitMethod = splitMethods.HORIZONTAL;

/**
*	Variable that store how far away from the side edges new points can spawn
*
*	@type {Integer}
*/
let xBuffer;

/**
*	Variable that store how far away from the top and bottom edges new points
*	can spawn
*
*	@type {Integer}
*/
let yBuffer;

/**
*	Enumeration of the different algorithm types
*
*	@enum {String}
*/
const algorithms = Object.freeze({
	MONOTONE: "Monotone Chain",
	JARVIS: "Jarvis March",
	DIVIDE: "Divide & Conquer",
	GRAHAM: "Graham Scan"
});

/**
*	Variable that stores the current algorithm tha is being executed
*
*	@type {Enum<String>}
*/
let algorithm = algorithms.JARVIS;

/**
*	Pointer for the number of points slider in the DOM
*
*	@type {p5.Element}
*/
let pointsSlider;

/**
*	Number of points to be bound by the generated convex hull
*
*	@type {Integer}
*/
let numPoints = 45;

/**
*	Pointer for the paragraph which shows the number of points in the DOM
*
*	@type {p5.Element}
*/
let pointsDisplay;

/**
*	Size of the points drawn on the canvas
*
*	@type {Integer}
*/
let pointRadius = 10;

/**
*	Pointer to select field that selects the executing algorithm
*
*	@type {p5.Element}
*/
let selectAlgorithm;


/**
*	Pointer to select field that selects the method that is used to split the
*	points when divide and conquer is running
*
*	@type {p5.Element}
*/
let selectSplitMethod;

/**
*	Pointer to select field that selects the direction that the Jarvis march
*	algorithm finds theconvex hull
*
*	@type {p5.Element}
*/
let selectAngularDirection;

// Shared algorithm state variables
let hull = [];
let lower = [];
let upper = [];
let index = 2;
let currentIndex = -1;
let nextIndex = 1;
let time = 0;
let leftPointIndex = 0;
let finalHull = [];
let finalPoints = [];
let internalHulls = [[], [], []];
let internalPoints = [[], [], []];
let jarvisStep = 0;
let grahamStep = 0;
let monotoneStep = 0;
let divideStep = 0;
let angularDirection;
const calculateFrameRate = 15;

/**
*	Reset all algorithm variables to initial values
*/
function reset() {
	// Reset algorithm state variables
	hull = [];
	jarvisStep = 0;
	leftPointIndex = 0;
	currentIndex = -1;
	nextIndex = 1;
	index = 2;
	time = 0;
	
	internalHulls = [[], [], []];
	finalHull = [];
	finalPoints = [];
	lower = [];
	upper = [];
	
	divideStep = divideSteps.SPLIT;
	jarvisStep = jarvisSteps.LEFT;
	monotoneStep = monotoneSteps.SORT;
	grahamStep = grahamSteps.SORT;
	
	// Generate new points with better distribution
	points = [];
	const margin = Math.max(width, height) * 0.1;
	const effectiveWidth = width - 2 * margin;
	const effectiveHeight = height - 2 * margin;
	
	for(let i = 0; i < numPoints; ++i) {
		// Use polar coordinates for better point distribution
		const r = random(0, Math.min(effectiveWidth, effectiveHeight) / 2);
		const theta = random(0, TWO_PI);
		const x = width/2 + r * cos(theta);
		const y = height/2 + r * sin(theta);
		
		// Ensure points are within bounds
		const boundedX = constrain(x, margin, width - margin);
		const boundedY = constrain(y, margin, height - margin);
		
		points.push(createVector(boundedX, boundedY));
	}
	
	// Add some points near the edges for better hull testing
	for(let i = 0; i < min(4, numPoints/10); i++) {
		const angle = random(TWO_PI);
		const x = width/2 + (effectiveWidth/2 - margin/2) * cos(angle);
		const y = height/2 + (effectiveHeight/2 - margin/2) * sin(angle);
		points.push(createVector(x, y));
	}
}

/**
*	Changes the algorithm depending on what the value of the selectAlgorithm
*	element is
*/
function algorithmSelectEvent() {
	let selectVal = selectAlgorithm.value();
	if(selectVal != algorithm) {
		algorithm = selectVal;
	}

	if(algorithm == algorithms.DIVIDE) {
		selectSplitMethod.show();
	} else {
		selectSplitMethod.hide();
	}

	if(algorithm == algorithms.JARVIS) {
		selectAngularDirection.show();
	} else {
		selectAngularDirection.hide();
	}

	if(algorithm == algorithms.MONOTONE) {
		// show monotone chain options
	} else {
		// hide monotone chain options
	}

	if(algorithm == algorithms.GRAHAM) {
		// show graham scan options
	} else {
		// hide graham scan options
	}

	reset();
}

/**
*	Changes the method for splitting the points in divide and conquer depending
*	on the value of the selectSplitMethod element
*/
function splitSelectEvent() {
	selectVal = selectSplitMethod.value();
	if(selectVal != splitMethod) {
		splitMethod = selectVal;
		reset();
	}
}

/**
*	Changes the direction the jarvis march algorithm selects new points for the
*	convex hull depending on the value of the selectAngularDirection element
*/
function angularSelectEvent() {
	selectVal = selectAngularDirection.value();
	if(selectVal != angularDirection) {
		angularDirection = selectVal;
		reset();
	}
}

/**
*	Draws a convex hull with a given colour
*
*	@param hullArray {Array<p5.Vector>} Array of points that amke up the
*		verticies of the hull.
*
*	@param colour {Integer} Value of the hue of the given hull from 0 to 100
*/
function drawHull(hullArray, colour) {
	if (!hullArray || hullArray.length < 3) return;
	
	push();
	colorMode(HSB, 100);
	
	// Draw filled hull
	fill(colour, 70, 100, 30);
	noStroke();
	beginShape();
	for (let i = 0; i < hullArray.length; i++) {
		vertex(hullArray[i].x, hullArray[i].y);
	}
	endShape(CLOSE);
	
	// Draw hull edges and vertices
	for (let i = 0; i < hullArray.length; i++) {
		// Draw edge
		stroke(colour, 100, 100);
		strokeWeight(2);
		const next = (i + 1) % hullArray.length;
		line(hullArray[i].x, hullArray[i].y, hullArray[next].x, hullArray[next].y);
		
		// Draw vertex
		push();
		fill(colour, 100, 100);
		strokeWeight(1);
		ellipse(hullArray[i].x, hullArray[i].y, pointRadius * 1.2, pointRadius * 1.2);
		pop();
	}
	
	colorMode(RGB);
	pop();
}

/**
*	Draws the edges of a convex hull with a given colour
*
*	@param hullArray {Array<p5.Vector>} Array of points that amke up the
*		verticies of the hull.
*
*	@param colour {Integer} Value of the hue of the given hull from 0 to 100
*/
function drawEdges(hullArray, colour) {
	if (!hullArray || hullArray.length < 2) return;
	
	push();
	colorMode(HSB, 100);
	
	// Draw edges
	stroke(colour, 100, 100, 80);
	strokeWeight(2);
	noFill();
	beginShape();
	for (let i = 0; i < hullArray.length; i++) {
		vertex(hullArray[i].x, hullArray[i].y);
		
		// Draw vertices
		push();
		fill(colour, 100, 100);
		strokeWeight(1);
		ellipse(hullArray[i].x, hullArray[i].y, pointRadius * 1.2, pointRadius * 1.2);
		pop();
	}
	if (hullArray.length > 2) {
		endShape(CLOSE);
	} else {
		endShape();
	}
	
	colorMode(RGB);
	pop();
}

/**
*   p5.js setup function, creates canvas.
*/
function setup() {
	// Calculate canvas size based on window dimensions
	let cnvSize;
	if(windowWidth > windowHeight) {
		cnvSize = min(0.8 * windowHeight, 800);
	} else {
		cnvSize = min(0.8 * windowWidth, 800);
	}
	
	// Create square canvas for better visualization
	let cnv = createCanvas(cnvSize, cnvSize);
	cnv.parent("sketch");
	
	// Set optimal frame rate for visualization
	frameRate(30);
	
	// Initialize UI elements
	pointsSlider = createSlider(12, 100, numPoints, 1);
	pointsSlider.parent("num-points");
	pointsSlider.style('width', '200px');
	
	pointsDisplay = createP(numPoints);
	pointsDisplay.parent("points-val");
	
	// Initialize algorithm selector
	selectAlgorithm = createSelect();
	selectAlgorithm.parent("algorithm");
	selectAlgorithm.option(algorithms.JARVIS);
	selectAlgorithm.option(algorithms.DIVIDE);
	selectAlgorithm.option(algorithms.MONOTONE);
	selectAlgorithm.option(algorithms.GRAHAM);
	selectAlgorithm.changed(algorithmSelectEvent);
	
	// Initialize direction selector
	selectAngularDirection = createSelect();
	selectAngularDirection.parent("algorithm-options");
	selectAngularDirection.option(direction.CLOCKWISE);
	selectAngularDirection.option(direction.ANTICLOCKWISE);
	selectAngularDirection.changed(angularSelectEvent);
	selectAngularDirection.hide();
	
	// Initialize split method selector
	selectSplitMethod = createSelect();
	selectSplitMethod.parent("algorithm-options");
	selectSplitMethod.option(splitMethods.HORIZONTAL);
	selectSplitMethod.option(splitMethods.VERTICAL);
	selectSplitMethod.option(splitMethods.RADIAL);
	selectSplitMethod.changed(splitSelectEvent);
	selectSplitMethod.hide();
	
	// Create reset button
	resetButton = createButton("Reset");
	resetButton.parent("reset-button");
	resetButton.mousePressed(reset);
	resetButton.class('btn btn-primary');
	
	// Initialize viewport parameters
	pointRadius = cnvSize * 0.015;  // Scale point size with canvas
	xBuffer = 0.05 * width;
	yBuffer = 0.05 * height;
	
	// Generate initial points
	reset();
	
	// Show control panel
	controlPanel = document.getElementById("control-panel");
	controlPanel.style.visibility = "visible";
}

/**
*   p5.js draw function, is run every frame to create the desired animation
*/
function draw() {
	background(0);
	fill(255);
	textSize(height * 0.03);
	textAlign(LEFT, TOP);
	noStroke();
	text(algorithm, 0, 0);

	let sliderVal = pointsSlider.value();
	if(sliderVal != numPoints) {
		numPoints = sliderVal;
		pointsDisplay.elt.innerText = "Number of Points: " + str(numPoints);
		reset();
	}

	// Draw all points with proper styling
	push();
	stroke(255);
	strokeWeight(1);
	fill(255);
	for (var i = points.length - 1; i >= 0; i--) {
		ellipse(points[i].x, points[i].y, pointRadius, pointRadius);
	}
	pop();

	switch(algorithm) {
		case algorithms.JARVIS:
		jarvisMarch();
		break;

		case algorithms.MONOTONE:
		monotoneChain();
		break;

		case algorithms.DIVIDE:
		divideAndConquer();
		break;

		case algorithms.GRAHAM:
		grahamScan();
		break;

		default:
		background(255);
		break;
	}
}
