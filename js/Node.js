const Edge = require('./Edge')
const Tombola = require('./math/tombola')
const _ = require('underscore')
const PIXI = require('pixi.js')
import { ease, Ease } from 'pixi-ease'
const HUB_SIZE = 5;
const MAX_SIZE = 5;
let DECK = new Tombola().deck( [0, 45, 90, 135, 180, 225, 270, 315] )

function setDefaults(options, defaults){
    return _.defaults({}, _.clone(options), defaults);
}

class Node {
    constructor(stage, options) {
        this.stage = stage
        this.edgeSet = new Set();
		this.bots = new Set();
		this.availableHousesDeck = new Tombola().deck();

        let defaults = {
            isHub: false,
            posX: 0,
            posY: 0,
            type: "road",
            modifier: null
        }
        options = setDefaults(options, defaults)
        if (isNaN(options.posX)) {
            throw("OOPS")
        }
        this.position = {posX: options.posX, posY: options.posY}
        this.isHub = options.isHub
        this.type = options.type
        this.modifier = options.modifier

        this.drawObject = null

        this.draw()
 
        }

    draw = () => {
        if (this.drawObject) {
            this.drawObject.clear()
        }
        if (this.isHub) {
            let circle = new PIXI.Graphics()
            circle.lineStyle(0)
            circle.beginFill(0xA1A1A1, 1);
            circle.alpha = 0;
            // circle.drawCircle(0, 0, 4);
            circle.drawStar(0, 0, 3, 5, 5, 0);
            circle.endFill();
            circle.position.set(this.position.posX, this.position.posY)
            this.stage.addChildAt(circle, 1)
            ease.add(circle, { scale: 4, alpha: 1 }, { duration: 1000, reverse: false })
			this.drawObject = circle
			this.circle = circle

        } else if (this.type == "wall" && this.modifier === "entry") {
            // Draw Rectangle
            let rectangle = new PIXI.Graphics()
            rectangle.lineStyle();
            rectangle.beginFill(0xFDFDFD, 1);
            rectangle.drawRoundedRect(0, 0, 70, 70, 3);
            rectangle.endFill();
            rectangle.alpha = 0;
            rectangle.position.set(this.position.posX - 0.5*rectangle.width, this.position.posY - 0.5*rectangle.height)
            this.stage.addChildAt(rectangle, 1)
            // Animate rectangle
            ease.add(rectangle, { alpha: 1 }, { duration: 1000, reverse: false })
            this.drawObject = rectangle
        }else {
            // Draw Rectangle
            let rectangle = new PIXI.Graphics()
            rectangle.lineStyle(0);
            rectangle.beginFill(0xBBBBBB, 1);
            rectangle.drawRect(0, 0, 2.5, 2.5);
            rectangle.alpha = 0;
            rectangle.endFill();
            rectangle.position.set(this.position.posX - 2*rectangle.width, this.position.posY - 2*rectangle.height)
            this.stage.addChildAt(rectangle, 1)
            // Animate rectangle
            ease.add(rectangle, { scale: 4, alpha: 1 }, { duration: 1000, reverse: false })
            this.drawObject = rectangle
        }
    }

    // get a set of connected edges to this node
    getConnectedNodes = () => {
        let nodes = new Set()
        this.edgeSet.forEach( (edge) => {
            nodes.add(edge.getDestination(this))
        })
        return nodes
    }

    createRandomEdge = (options) => {
        let validAngle = false
        let currentAngles = this.getEdgeAngles()
        let angle = null
        while (!validAngle) {
            angle = DECK.look()
            // TO DO: check for other nodes which are close / other edge intersections
            if (!currentAngles.has(angle))
            validAngle = true
        }
        let newPosX = this.position.posX + Math.round(options.distance * Math.cos(angle * Math.PI / 180))
        let newPosY = this.position.posY + Math.round(options.distance * Math.sin(angle * Math.PI / 180))
        let newNode = new Node(this.stage, { posX: newPosX, posY: newPosY })
        let newEdge = new Edge(this.stage, { connectingNodes: [this, newNode], angle: angle})
        newNode.addEdge(newEdge)
        this.edgeSet.add(newEdge)
        return { newNode: newNode, newEdge: newEdge}
    }

    createEdge = (options) => {
        let angle = options.direction
        let newPosX = this.position.posX + Math.round(options.distance * Math.cos(angle * Math.PI / 180))
        let newPosY = this.position.posY + Math.round(options.distance * Math.sin(angle * Math.PI / 180))
        let newNode;
        if (options.nodeType === 'hub') {
            newNode = new SocialHub(this.stage, { posX: newPosX, posY: newPosY, isHub: true })
        } else {
            newNode = new Node(this.stage, { posX: newPosX, posY: newPosY })
        }
        let newEdge = new Edge(this.stage, { connectingNodes: [this, newNode], angle: angle})
		newNode.addEdge(newEdge)
		this.addEdge(newEdge)
        return { newNode: newNode, newEdge: newEdge }
    }

    getEdgeAngles = () => {
        let angles = new Set()
        this.edgeSet.forEach( edge => {
            angles.add(edge.getAngle(this))
        })
        return angles
    }

    // add an edge to a node
    addEdge = (edge) => {
        return this.edgeSet.add(edge)
    }

    // remove an edge of a node
    deleteEdge = (edge) => {
        return this.edgeSet.delete(edge)
    }

    // check if an edge is connected to this node
    hasEdge = (edge) => {
        return this.edgeSet.has(edge)
	}

	getNodeVacancies = () => {
		let availableHouses = []
		for (var edge of Array.from(this.edgeSet)) {
			availableHouses.push(...edge.getEdgeVacancies());
		}
		return availableHouses;
    }
}

class SocialHub extends Node {
    constructor(stage, options) {
        super(stage, options)

        while (this.bots.size > 0) {
            ease.add(this.circle, { rotation: size / 2 }, { duration: 500, reverse: false })
        }
    }

    resize() {
        let size;
        if (this.bots.size >= 10) {
            size = MAX_SIZE;
        } else {
            size = Math.log(this.bots.size + 1);
		}
        ease.add(this.circle, { scale: size + HUB_SIZE }, { duration: 1000, reverse: false })
    }
}

module.exports = Node, SocialHub;
