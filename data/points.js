// Coordinates are percentages of the FULL map image.
// x: distance from the left edge; y: distance from the top edge.
// Array order defines the route. Change only x and y to move a stop.
const MAP_POINTS = [
  // Raft landing, then travel LEFT along the lower trail.
  { id: "start", label: "START", x: 73, y: 69 },
  { id: "stop-2", label: "2", x: 63, y: 60 },
  { id: "stop-3", label: "3", x: 51, y: 59 },
  { id: "stop-4", label: "4", x: 44, y: 63 },
  { id: "stop-5", label: "5", x: 33, y: 67 },
  { id: "stop-6", label: "6", x: 23, y: 70 },
  // Wide bend LEFT of the tree, then ABOVE its canopy.
  { id: "stop-7", label: "7", x: 18, y: 55 },
  { id: "stop-8", label: "8", x: 19, y: 39 },
  { id: "stop-9", label: "9", x: 28, y: 29 },
  { id: "stop-10", label: "10", x: 40, y: 31 },
  // Turn right onto the central trail and cross the river on the bridge.
  { id: "stop-11", label: "11", x: 46, y: 41 },
  { id: "stop-12", label: "12", x: 56, y: 50 },
  { id: "stop-13", label: "13", x: 68, y: 48 },
  // East bank, winding uphill trail, then the cave entrance.
  { id: "stop-14", label: "14", x: 72, y: 44 },
  { id: "stop-15", label: "15", x: 75, y: 34 },
  { id: "stop-16", label: "16", x: 84, y: 29 },
  { id: "stop-17", label: "17", x: 91, y: 25 },
  { id: "finish", label: "FINISH", x: 85, y: 22 },
];
