const points = [];
const spacer = 10;
const rounds = 6;
let addMode = false;

function keyPressed() {
	if (keyCode === ESCAPE) {
		addMode = false;
		console.log("addmode");
	}
}

function mouseClicked() {
	if (addMode) points.push(createVector(mouseX, mouseY));
}

function setup() {
	createCanvas(600, 600);
	ellipseMode(RADIUS);

	points.push(createVector(100, 100));
	points.push(createVector(500, 100));
	points.push(createVector(505, 250));
	points.push(createVector(500, 500));
	points.push(createVector(100, 500));
	points.push(createVector(200, 400));
	points.push(createVector(200, 300));
	points.push(createVector(100, 220));
	points.push(createVector(200, 150));
	noFill();

	noLoop();
}

function draw() {
	background(220);
	if (addMode) points.push(createVector(mouseX, mouseY));

	// Draw the curve
	beginShape();
	for (let round = 1; round <= rounds; round++) {
		for (let i = 0; i < points.length; i++) {
			const currentPoint = points[i];
			const prevPoint = i > 0 ? points[i - 1] : points[points.length - 1];
			const nextPoint = i < points.length - 1 ? points[i + 1] : points[0];
			const secondNextPoint = i < points.length - 2 ? points[i + 2] : points[0];

			const v1 = p5.Vector.sub(currentPoint, prevPoint);
			const v2 = p5.Vector.sub(nextPoint, currentPoint);
			const cp = v1.cross(v2);
			const clockWise = cp.z < 0;

			const v3 = p5.Vector.sub(nextPoint, secondNextPoint);
			const nextCp = v3.cross(v2);
			const nextClockWise = nextCp.z < 0;

			const spacerStep = spacer / points.length;
			const roundFactor = clockWise ? rounds - round + 1 : round;
			const radius = spacerStep * i + roundFactor * spacer;

			// Determine if there's a direction change between current point and next point
			const directionChange = clockWise !== nextClockWise;

			// Calculate the basic angles
			const nextAngle = getTouchAngle(currentPoint, nextPoint, radius, clockWise);
			const prevAngle = getTouchAngle(currentPoint, prevPoint, radius, clockWise);

			// Use the proper offset for the bezier arc
			bezierArc(
				currentPoint.x,
				currentPoint.y,
				radius,
				prevAngle + HALF_PI * (clockWise ? -1 : 1),
				nextAngle + HALF_PI * (clockWise ? 1 : -1),
				clockWise
			);
		}
	}
	endShape();
	
	// We'll mark the start and end points of the bezier arcs in the bezierArc function
	
	// Add point labels after drawing the curves
	for (let i = 0; i < points.length; i++) {
		drawPointLabel(points[i], i);
	}
	
	if (addMode) points.pop();
}

// Function to draw a number at each point
function drawPointLabel(point, index) {
	push();
	fill(0);
	noStroke();
	textSize(14);
	textAlign(CENTER, CENTER);
	text(index, point.x, point.y - 15);
	
	// Also draw a small circle at the point for clarity
	stroke(255, 0, 0);
	fill(255, 0, 0);
	ellipse(point.x, point.y, 3, 3);
	pop();
}

function getTouchAngle(c1, c2, radius, clockWise) {
	// Calculate the basic angle between points
	const centerAngle = atan2(c2.y - c1.y, c2.x - c1.x);
	
	// We don't need to adjust with asin(radius/d) as that's causing issues
	// Just return the basic angle between the points
	return centerAngle;
}

function bezierArc(cx, cy, radius, startAngle, endAngle, clockwise) {
	let maxAngle = PI / 18; // Keep small segments for smooth curves
	
	// Calculate the total angle difference, considering direction
	let totalAngle = endAngle - startAngle;
	
	// Normalize the angle based on direction
	if (clockwise) {
		// Make sure we go clockwise
		if (totalAngle > 0) totalAngle = totalAngle - TWO_PI;
	} else {
		// Make sure we go counterclockwise
		if (totalAngle < 0) totalAngle = totalAngle + TWO_PI;
	}
	
	let totalSegments = ceil(abs(totalAngle) / maxAngle);
	let angleIncrement = totalAngle / totalSegments;
	
	// Calculate start and end points of the entire arc
	let arcStartX = cx + radius * cos(startAngle);
	let arcStartY = cy + radius * sin(startAngle);
	let arcEndX = cx + radius * cos(endAngle);
	let arcEndY = cy + radius * sin(endAngle);
	
	// Mark the start point with a blue dot (only for the first round)
	if (rounds === 6) { // Assuming we're in the first round when radius is largest
		push();
		fill(0, 0, 255);
		noStroke();
		ellipse(arcStartX, arcStartY, 6, 6);
		pop();
	}
	
	// Mark the end point with a yellow dot (only for the first round)
	if (rounds === 6) { // Assuming we're in the first round when radius is largest
		push();
		fill(255, 255, 0);
		noStroke();
		ellipse(arcEndX, arcEndY, 6, 6);
		pop();
	}
	
	// Draw the segments
	for (let i = 0; i < totalSegments; i++) {
		let segmentStart = startAngle + i * angleIncrement;
		let segmentEnd = segmentStart + angleIncrement;
		
		if (i == 0) {
			let startX = cx + radius * cos(segmentStart);
			let startY = cy + radius * sin(segmentStart);
			vertex(startX, startY);
		}
		
		bezierArcSegment(cx, cy, radius, segmentStart, segmentEnd);
	}
}

function bezierArcSegment(cx, cy, radius, startAngle, endAngle) {
	let startX = cx + radius * cos(startAngle);
	let startY = cy + radius * sin(startAngle);
	let endX = cx + radius * cos(endAngle);
	let endY = cy + radius * sin(endAngle);

	let alpha =
		sin(endAngle - startAngle) * (4 / 3) * tan((endAngle - startAngle) / 4);

	let control1X = startX - alpha * radius * sin(startAngle);
	let control1Y = startY + alpha * radius * cos(startAngle);

	let control2X = endX + alpha * radius * sin(endAngle);
	let control2Y = endY - alpha * radius * cos(endAngle);

	bezierVertex(control1X, control1Y, control2X, control2Y, endX, endY);
}
