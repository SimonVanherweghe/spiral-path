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

			const nextAngle =
				getTouchAngle(
					currentPoint,
					nextPoint,
					rounds * spacer,
					clockWise,
					nextClockWise
				) +
				HALF_PI * (clockWise ? 1 : -1);

			const prevAngle =
				getTouchAngle(
					currentPoint,
					prevPoint,
					rounds * spacer,
					clockWise,
					nextClockWise
				) +
				HALF_PI * (clockWise ? -1 : 1);

			bezierArc(
				currentPoint.x,
				currentPoint.y,
				radius,
				prevAngle,
				nextAngle,
				clockWise
			);
		}
	}
	endShape();
	if (addMode) points.pop();
}

function getTouchAngle(c1, c2, r1, r2, clockWise, nextClockWise) {
	const d = c1.dist(c2);

	const centerAngle = atan2(c2.y - c1.y, c2.x - c1.x);
	let radiAngle = asin(r1 / d);

	const angle = centerAngle + radiAngle;
	return angle;
}

function bezierArc(cx, cy, radius, startAngle, endAngle, clockwise) {
	let maxAngle = PI / 18;

	let totalAngle = endAngle - startAngle;
	if (clockwise) {
		totalAngle = (totalAngle - TWO_PI) % TWO_PI; // Adjust to counterclockwise
	} else {
		totalAngle = (totalAngle + TWO_PI) % TWO_PI; // Adjust to clockwise
	}

	let totalSegments = ceil(abs(totalAngle) / maxAngle);
	let angleIncrement = totalAngle / totalSegments;

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
