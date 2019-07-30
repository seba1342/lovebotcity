const Map = require('./Map')

let a = new Map()

window.setInterval(function(){
    createNode()
  }, 100)

function createNode() {
    let object = a.createRandomNode()
    let newNode = object.newNode
    let newEdge = object.newEdge
    drawCoordinates(newNode.position.posX + 300, newNode.position.posY + 300)
    let positions = newEdge.getPositions()
    drawLine(positions[0], positions[1])
}

function drawLine(a, b) {
    var c = document.getElementById("canvas");
    var ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(a.posX + 300, a.posY + 300);
    ctx.lineTo(b.posX + 300, b.posY + 300);
    ctx.stroke()
}
function drawCoordinates(x,y){
    var pointSize = 3; // Change according to the size of the point.
    var ctx = document.getElementById("canvas").getContext("2d");


    ctx.fillStyle = "#ff2626"; // Red color

    ctx.beginPath(); //Start path
    ctx.arc(x, y, pointSize, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
    ctx.fill(); // Close the path and fill.
}

