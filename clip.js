var findSide = require('./find-side');

// determine the intersection point of a line segment with a line
// original: http://paulbourke.net/geometry/pointlineplane/pdb.c
var EPS = 0.000001;

// first four arguments are the line (aka plane): x1, y1, x2, y2
// the segment is defined by the last four: x3, y3, x4, y4
function seg (x1, y1, x2, y2, x3, y3, x4, y4, segmentTest) {
  var denom  = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // never return NaN
  if ((denom === 0) || isNaN(denom)) {
    return;
  }

  var numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  var numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

  // are the line coincident?
  if (Math.abs(numera) < EPS && Math.abs(numerb) < EPS && Math.abs(denom) < EPS) {
    return [
      (x1 + x2) / 2,
      (y1 + y2) / 2
    ];
  }

  // are the line parallel?
  if (Math.abs(denom) < EPS) {
    return; // no intersection
  }

  // is the intersection along the the segment?
  var mua = numera / denom;
  var mub = numerb / denom;

  if (!segmentTest(mua, mub)) {
    return [
      x1 + (mua) * (x2 - x1),
      y1 + (mua) * (y2 - y1)
    ]
  }
}

function segline (x1, y1, x2, y2, x3, y3, x4, y4) {
  return seg(x1, y1, x2, y2, x3, y3, x4, y4, function (mua, mub) {
    // does the line intersect the segment?
    if ((mua < 0) && (mua > 1) || (mub < 0) || (mub > 1)) {
      return true;
    }
  });
}

function lineline (x1, y1, x2, y2, x3, y3, x4, y4) {
  return seg(x1, y1, x2, y2, x3, y3, x4, y4, function () {
    return true; // if we're in this callback we know we have two lines that aren't parallel
  });
}

function segseg (x1, y1, x2, y2, x3, y3, x4, y4) {
  return seg(x1, y1, x2, y2, x3, y3, x4, y4, function (mua, mub) {
    // do the two segments intersect?
    if ((mua < 0) || (mua > 1) || (mub < 0) || (mub > 1)) {
      return true;
    }
  });
}

function nick (poly, nickingPlanes) {
  poly.splice(0, 0, poly[poly.length - 1]);

  var result = [];
  for (var x = 0; x < poly.length - 1; x++) {
    var lastX = poly[x][0];
    var lastY = poly[x][1];
    var currentX = poly[x + 1][0];
    var currentY = poly[x + 1][1];

    var intersection = segline(nickingPlanes[0], nickingPlanes[1], nickingPlanes[2], nickingPlanes[3], currentX, currentY, lastX, lastY);

    if (Array.isArray(intersection)) {
      result.push([intersection[0], intersection[1], 'nicked']);
    }
    result.push([currentX, currentY]);
  }

  return result;
}

function clip (poly, cuttingPlane) {
  var left = [];
  var right = [];

  var lastPointSide;
  if (!poly || !poly[0]) return {left: undefined, right: undefined};

  for (var i = 0; i < poly.length; i++) {
    var lastX = poly[i][0];
    var lastY = poly[i][1];
    var n = (i + 1) % poly.length;
    var currentX = poly[n][0];
    var currentY = poly[n][1];

    var side = findSide(cuttingPlane[0], cuttingPlane[1], cuttingPlane[2], cuttingPlane[3], currentX, currentY);

    // does the current line segment intersect the cuttingPlane?
    if ((lastPointSide !== 0) && (side !== 0)) {
      var intersection = segline(cuttingPlane[0], cuttingPlane[1], cuttingPlane[2], cuttingPlane[3], currentX, currentY, lastX, lastY);

      if (Array.isArray(intersection)) {
        left.push([intersection[0], intersection[1]]);
        right.push([intersection[0], intersection[1]]);
      }
    }

    if (side < 0) {
      left.push([currentX, currentY]);
    }
    else if (side === 0) {
      left.push([currentX, currentY]);
      right.push([currentX, currentY]);
    }
    else {
      right.push([currentX, currentY]);
    }

    // set lastPointSide for next iteration
    lastPointSide = side;
  }

  return {
    left: left,
    right: right,
    edges: [i, n]
  }
}

exports.nick = nick;
exports.clip = clip;
exports.segline = segline;
exports.lineline = lineline;
exports.segseg = segseg;
