import "./style.css";
import p5 from "p5";
import init, { p5SVG } from "p5.js-svg";

init(p5);

const points = [];
let spacer = 5;
let rounds = 6;
let addMode = true;
let debugMode = false;
let snapMode = false;
let dragIndex = -1;
const SNAP_THRESHOLD = 10;
let snappedX = 0;
let snappedY = 0;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(420, 420, p.SVG);
    p.ellipseMode(p.RADIUS);

    p.noFill();
  };

  const computeSnap = (mx, my, skipIndex = -1) => {
    let sx = mx, sy = my;
    let bestXDist = SNAP_THRESHOLD, bestYDist = SNAP_THRESHOLD;
    let snapXSource = null, snapYSource = null;
    for (let i = 0; i < points.length; i++) {
      if (i === skipIndex) continue;
      const pt = points[i];
      const dx = Math.abs(mx - pt.x);
      const dy = Math.abs(my - pt.y);
      if (dx < bestXDist) { bestXDist = dx; sx = pt.x; snapXSource = pt; }
      if (dy < bestYDist) { bestYDist = dy; sy = pt.y; snapYSource = pt; }
    }
    return { x: sx, y: sy, snapXSource, snapYSource };
  };

  p.draw = () => {
    p.clear();
    p.background(255);

    // Compute snapped cursor position from existing points
    if (snapMode) {
      const snap = computeSnap(p.mouseX, p.mouseY);
      snappedX = snap.x;
      snappedY = snap.y;

      // Draw guidelines behind everything
      if (snap.snapXSource || snap.snapYSource) {
        p.push();
        p.stroke(0, 120, 255, 120);
        p.strokeWeight(1);
        if (snap.snapXSource) p.line(snappedX, 0, snappedX, p.height);
        if (snap.snapYSource) p.line(0, snappedY, p.width, snappedY);
        p.pop();
      }
    } else {
      snappedX = p.mouseX;
      snappedY = p.mouseY;
    }

    if (addMode) points.push(p.createVector(snappedX, snappedY));

    // Precompute turn directions at each point (independent of round)
    const clockWiseArr = [];
    points.forEach((currentPoint, i) => {
      const prevPoint = i > 0 ? points[i - 1] : points[points.length - 1];
      const nextPoint = i < points.length - 1 ? points[i + 1] : points[0];
      const v1 = p5.Vector.sub(currentPoint, prevPoint);
      const v2 = p5.Vector.sub(nextPoint, currentPoint);
      const cp = v1.cross(v2);
      clockWiseArr.push(cp.z < 0);
    });

    // Draw the curve
    p.beginShape();
    for (let round = 1; round <= rounds; round++) {
      // Precompute radii for all points in this round
      const radii = [];
      for (let i = 0; i < points.length; i++) {
        const spacerStep = spacer / points.length;
        const roundFactor = clockWiseArr[i] ? rounds - round + 1 : round;
        radii.push(spacerStep * i + roundFactor * spacer);
      }

      for (let i = 0; i < points.length; i++) {
        const currentPoint = points[i];
        const prevI = i > 0 ? i - 1 : points.length - 1;
        const nextI = i < points.length - 1 ? i + 1 : 0;
        const prevPoint = points[prevI];
        const nextPoint = points[nextI];

        const clockWise = clockWiseArr[i];
        const prevClockWise = clockWiseArr[prevI];
        const nextClockWise = clockWiseArr[nextI];
        const radius = radii[i];
        const prevRadius = radii[prevI];
        const nextRadius = radii[nextI];
        const signCur = clockWise ? 1 : -1;

        // Entry angle: proper tangent from prev arc to current arc
        const prevToCurAngle = p.atan2(
          currentPoint.y - prevPoint.y,
          currentPoint.x - prevPoint.x,
        );
        const dIn = p.dist(
          prevPoint.x,
          prevPoint.y,
          currentPoint.x,
          currentPoint.y,
        );
        let deltaIn;
        if (dIn < 0.001) {
          deltaIn = 0;
        } else if (prevClockWise === clockWise) {
          // External tangent: same rotation side
          deltaIn = p.asin(p.constrain((radius - prevRadius) / dIn, -1, 1));
        } else {
          // Cross tangent: opposite rotation sides
          deltaIn =
            signCur * p.asin(p.constrain((prevRadius + radius) / dIn, -1, 1));
        }
        const entryAngle = prevToCurAngle + deltaIn + signCur * p.HALF_PI;

        // Exit angle: proper tangent from current arc to next arc
        const curToNextAngle = p.atan2(
          nextPoint.y - currentPoint.y,
          nextPoint.x - currentPoint.x,
        );
        const dOut = p.dist(
          currentPoint.x,
          currentPoint.y,
          nextPoint.x,
          nextPoint.y,
        );
        let deltaOut;
        if (dOut < 0.001) {
          deltaOut = 0;
        } else if (clockWise === nextClockWise) {
          // External tangent: same rotation side
          deltaOut = p.asin(p.constrain((nextRadius - radius) / dOut, -1, 1));
        } else {
          // Cross tangent: opposite rotation sides
          const signNext = nextClockWise ? 1 : -1;
          deltaOut =
            signNext * p.asin(p.constrain((radius + nextRadius) / dOut, -1, 1));
        }
        const exitAngle = curToNextAngle + deltaOut + signCur * p.HALF_PI;

        bezierArc(
          currentPoint.x,
          currentPoint.y,
          radius,
          entryAngle,
          exitAngle,
          clockWise,
        );
      }
    }
    p.endShape();

    // Add point labels after drawing the curves
    for (let i = 0; i < points.length; i++) {
      drawPointLabel(points[i], i);
    }

    if (addMode) points.pop();
  };

  p.keyPressed = () => {
    if (p.keyCode === p.ESCAPE) {
      addMode = !addMode;
    }
    if (p.keyCode === p.UP_ARROW) {
      rounds++;
    }
    if (p.keyCode === p.DOWN_ARROW) {
      rounds = p.max(1, rounds - 1);
    }
    if (p.keyCode === p.RIGHT_ARROW) {
      spacer++;
    }
    if (p.keyCode === p.LEFT_ARROW) {
      spacer = p.max(1, spacer - 1);
    }
    if (p.key === "d" || p.key === "D") {
      debugMode = !debugMode;
    }
    if (p.key === "g" || p.key === "G") {
      snapMode = !snapMode;
    }
    if (p.key === "c" || p.key === "C") {
      points.length = 0;
    }
    if (p.key === "s" || p.key === "S") {
      p.save("spiral.svg");
    }
    if (p.key === "r" || p.key === "R") {
      points.pop();
    }
  };

  p.mousePressed = () => {
    if (debugMode && !addMode) {
      dragIndex = points.findIndex(
        (pt) => p.dist(p.mouseX, p.mouseY, pt.x, pt.y) < 10,
      );
      return;
    }
    if (addMode) {
      points.push(p.createVector(snappedX, snappedY));
    }
  };

  p.mouseDragged = () => {
    if (debugMode && dragIndex !== -1) {
      if (snapMode) {
        const snap = computeSnap(p.mouseX, p.mouseY, dragIndex);
        points[dragIndex].set(snap.x, snap.y);
      } else {
        points[dragIndex].set(p.mouseX, p.mouseY);
      }
    }
  };

  p.mouseReleased = () => {
    dragIndex = -1;
  };

  const drawPointLabel = (point, index) => {
    if (!debugMode) return;
    p.push();
    p.fill(0);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(index, point.x, point.y - 15);

    // Also draw a small circle at the point for clarity
    const hovered =
      !addMode && p.dist(p.mouseX, p.mouseY, point.x, point.y) < 10;
    p.stroke(255, 0, 0);
    p.fill(255, 0, 0);
    p.ellipse(point.x, point.y, hovered ? 7 : 3, hovered ? 7 : 3);
    p.pop();
  };

  const bezierArc = (cx, cy, radius, startAngle, endAngle, clockwise) => {
    let maxAngle = p.PI / 18; // Keep small segments for smooth curves

    // Calculate the total angle difference, considering direction
    let totalAngle = endAngle - startAngle;

    // Normalize the angle based on direction
    if (clockwise) {
      // Make sure we go clockwise
      if (totalAngle > 0) totalAngle = totalAngle - p.TWO_PI;
    } else {
      // Make sure we go counterclockwise
      if (totalAngle < 0) totalAngle = totalAngle + p.TWO_PI;
    }

    let totalSegments = p.ceil(p.abs(totalAngle) / maxAngle);
    let angleIncrement = totalAngle / totalSegments;

    // Calculate start and end points of the entire arc
    let arcStartX = cx + radius * p.cos(startAngle);
    let arcStartY = cy + radius * p.sin(startAngle);
    let arcEndX = cx + radius * p.cos(endAngle);
    let arcEndY = cy + radius * p.sin(endAngle);

    // Mark the start point with a blue dot
    if (debugMode) {
      p.push();
      p.fill(0, 0, 255);
      p.noStroke();
      p.ellipse(arcStartX, arcStartY, 6, 6);
      p.pop();
    }

    // Mark the end point with a yellow dot
    if (debugMode) {
      p.push();
      p.fill(255, 255, 0);
      p.noStroke();
      p.ellipse(arcEndX, arcEndY, 6, 6);
      p.pop();
    }

    // Draw the segments
    for (let i = 0; i < totalSegments; i++) {
      let segmentStart = startAngle + i * angleIncrement;
      let segmentEnd = segmentStart + angleIncrement;

      if (i == 0) {
        let startX = cx + radius * p.cos(segmentStart);
        let startY = cy + radius * p.sin(segmentStart);
        p.vertex(startX, startY);
      }

      bezierArcSegment(cx, cy, radius, segmentStart, segmentEnd);
    }
  };

  const bezierArcSegment = (cx, cy, radius, startAngle, endAngle) => {
    let startX = cx + radius * p.cos(startAngle);
    let startY = cy + radius * p.sin(startAngle);
    let endX = cx + radius * p.cos(endAngle);
    let endY = cy + radius * p.sin(endAngle);

    let alpha =
      p.sin(endAngle - startAngle) *
      (4 / 3) *
      p.tan((endAngle - startAngle) / 4);

    let control1X = startX - alpha * radius * p.sin(startAngle);
    let control1Y = startY + alpha * radius * p.cos(startAngle);

    let control2X = endX + alpha * radius * p.sin(endAngle);
    let control2Y = endY - alpha * radius * p.cos(endAngle);

    p.bezierVertex(control1X, control1Y, control2X, control2Y, endX, endY);
  };
};

new p5(sketch, document.querySelector("main"));
