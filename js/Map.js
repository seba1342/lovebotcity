const Node = require('./Node.js')
const Edge = require('./Edge.js')
const Tombola = require('./math/tombola')
import Single from './Single.js';
import RootState from './RootState.js';
import { State } from 'pixi.js';
const intersects = require('intersects')
const lineIntersect = require('./math/line-intersect')
const _ = require('underscore')
const PIXI = require('pixi.js')
const PathFinder = require ('./math/PathFinder')
const Helper = require('./math/helper')
const MapCreator = require('./MapCreator')

const EDGE_SNAP_DIST = 500
const MAX_EDGE_SNAP_ANGLE = 20
const VALID_ANGLE_BUFFER_DIST = 300
const VALID_ANGLE_BUFFER_WIDTH = 100
const EXTEND_EDGE_BUFFER_DIST = 300
const EXTEND_EDGE_BUFFER_WIDTH = 50
const SOCIAL_HUB_MIN_DIST = 400
const ROAD_MIN_LENGTH = 150
const ROAD_MAX_LENGTH = 300



function setDefaults(options, defaults) {
	return _.defaults({}, _.clone(options), defaults)
}


class Map {
	constructor(stage) {
		this.nodes = new Set()
		this.socialHubs = new Set()
		this.bots = RootState.BotSet;
		this.nodeDeck = new Tombola().deck()
		this.stage = stage;
		this.edges = new Set()
		this.source = new Node(stage, { posX: 0, posY: 3000 })
		this.regions = { totalExpansions: 1, central: null, currentHubs: new Set() }
		this.nodes.add(this.source)
		// this.nodeDeck.insert(this.source)
        this.pathFinder = new PathFinder({nodeSet: this.nodes, edgeSet: this.edges })
		this.MapCreator = new MapCreator(this)
		this.walls = null
		this.initWalls()

	}

	initWalls = () => {
        let walls = this.MapCreator.createWalls({posX: 0, posY: 0}, 1200)
        let river = this.MapCreator.createRiver()
        for (const edge of walls.edges) {
            this.edges.add(edge)
        }
        for (const edge of river.edges) {
            this.edges.add(edge)
        }
        for (const node of walls.nodes) {
            // this.nodes.add(node)
            // this.nodeDeck.insert(node)
        }
        this.walls = walls
        let index
        for (let i=0; i<walls.length; i++) {
            if (walls[i].position.posX == 0 && walls[i].position.posY == 1000) {
                index = i
            }
        }
        this.walls.remaining = walls.nodes
        this.walls.remaining.splice(index, 1)
        // let a = this.createNode(0, 1500, {sourceNode: this.source, avoidDeck: true})
        let b = this.createNode(0, 1000, {sourceNode: this.source, avoidDeck: true})
        let c = this.createNode(0, 500, {sourceNode: b })
        let d = this.createNode(0, 0, {sourceNode: c })
        this.regions.central = d
        Array.from(this.source.edgeSet)[0].houses = []
    }
    
    connectEntries = () => {
        if (this.walls.remaining.length > 0) {
            let results = []
            this.walls.remaining.forEach( wallNode => {
                let closestNode = {distance: 9999, node: null}
                for (const node of this.nodes) {
                    let dist = new Helper().calculateDistanceFromNodes(node, wallNode)
                    if (dist < closestNode.distance) {
                        closestNode.distance = dist
                        closestNode.node = node
                    }
                }
                results.push({wallNode: wallNode, distance: closestNode.distance, connectingNode: closestNode.node})
            })
            results.sort( (a, b) =>  (a.distance > b.distance) ? 1 : -1)
            if (results) {
                if (results[0].distance < 500) {
                    let wallNode = results[0].wallNode
                    let connectingNode = results[0].connectingNode
                    let index = this.walls.remaining.indexOf(wallNode)
                    console.log("wallNode", wallNode)
                    this.walls.remaining.splice(index, 1);
                    let newEdge = new Edge(this.stage, { connectingNodes: [wallNode, connectingNode]})
                    wallNode.addEdge(newEdge)
                    connectingNode.addEdge(newEdge)
                    this.edges.add(newEdge)
                    this.nodes.add(wallNode)
                    this.nodeDeck.insert(wallNode)

                    if(results[0].wallNode == this.walls.bridge[0]) {
                        this.nodes.add(this.walls.bridge[1])
                        this.nodeDeck.insert(this.walls.bridge[1])
                        // this.walls.bridge[2].draw()
                    }
                }
            }
        }
    }


	getRegionStatus = (regionNode, distance) => {
		let count = 0
		let totalEdges = 0
		for (const edge of this.edges) {
			if (new Helper().calculateDistanceToEdge(regionNode, edge) < distance) {
				count += edge.getEdgeVacancies().length
				totalEdges += 1
			} 
		}
		return (1 - count / (totalEdges * 10))
	}

	tick = () => {
	}

	socialHubsRegionStatus = () => {
		let resultArray = []
		for (var socialHub of this.regions.currentHubs) {
			resultArray.push({ socialHub, density: this.getRegionStatus(socialHub, 300) })
		}
		resultArray.forEach(socialHubDensity => {
			if (socialHubDensity.density > 0.1) {
                this.regions.totalExpansions ++
				console.log('social hub is too dense, generating new suburb')
				let randomNodeArray = []
				for(var i = 0; i < Math.log(this.regions.totalExpansions + 1) * 5 ; i++) {
					let newNode = this.createRandomNode()
					if (!newNode) {
						console.log("undefined newNode")
					} else {
						randomNodeArray.push(newNode)
					}
                }
                for (let i = 0; i < Math.ceil(this.regions.totalExpansions / 10); i++) {
                    while (!this.generateSocialHub()) {
                            console.log("forcing regeneration...")
                            this.createRandomNode()
                }
                this.regions.currentHubs.delete(socialHubDensity.socialHub)
            }
        }
        });
        this.connectEntries()
		return resultArray
	}

	getIntersect(lineAStart, lineAEnd, lineBStart, lineBEnd) {
        let point = lineIntersect([[lineAStart.posX, lineAStart.posY], [lineAEnd.posX, lineAEnd.posY]],
            [[lineBStart.posX, lineBStart.posY], [lineBEnd.posX, lineBEnd.posY]])
        point = point.Right || point.Left
        return point
    }

    createIntermediateNode = (node, angle, edge) => {
        let newPosX = node.position.posX + Math.round(500 * Math.cos(angle * Math.PI / 180))
        let newPosY = node.position.posY + Math.round(500 * Math.sin(angle * Math.PI / 180))

        let positions = edge.getPositions()

        let point = this.getIntersect(node.position, {posX: newPosX, posY: newPosY},
            positions[1], positions[0])

        if (point) {
            let a, b
            for (const n of edge.edgeNodes) {
                a = n
                break
            }
            b = edge.getDestination(a)
            // let line = this.drawLine({posX: node.position.posX, posY: node.position.posY}, {posX: newPosX, posY: newPosY}, angle, 0xe74c3c)
            // let line2 = this.drawLine({posX: positions[0].posX, posY: positions[0].posY}, {posX: positions[1].posX , posY: positions[1].posY}, edge.angle, 0xe74c3c)
            let newNode = new Node(this.stage, { posX: point[0], posY: point[1] })
            let newEdge = new Edge(this.stage, { connectingNodes: [newNode, b], animate: false, angle: edge.angle})
            this.nodes.add(newNode)
            this.edges.add(newEdge)
            // update current edge to end at new intermediate node
            edge.update(b, newNode)
            // add old edge as an edge of new node
            newNode.addEdge(edge)
            // add new edge as an edge of new node
            newNode.addEdge(newEdge)
            this.nodeDeck.insert(newNode)
            return newNode
        }
        else {
            throw "Error"
        }
    }

    snappableToNode = (edge, position) => {
        let nodes = edge.getNodes()
        let distA = Math.hypot(position.posX - nodes[0].position.posX, position.posY - nodes[0].position.posY)
        let distB = Math.hypot(position.posX - nodes[1].position.posX, position.posY - nodes[1].position.posY)
        
        if (distA < distB && distA < EDGE_SNAP_DIST) {
            return nodes[0]
        } else if ( distB <= distA && distB < EDGE_SNAP_DIST ) {
            return nodes[1]
        } else {
            return null
        }
    }

    extendEdge = (node, angle) => {
        let possibleEdges = this.testIntersection(node.position, angle, {returnIntersections: true, bufferWidth: EXTEND_EDGE_BUFFER_WIDTH, bufferDistance: EXTEND_EDGE_BUFFER_DIST })
        let nodeDistances = [] 
        for (const edge of possibleEdges) {
            if (edge.type == "road") {
                let nodes = Array.from(edge.getNodes())
                nodeDistances.push({ distance: new Helper().calculateDistanceFromNodes(node, nodes[0]), node: nodes[0] })
                nodeDistances.push({ distance: new Helper().calculateDistanceFromNodes(node, nodes[1]), node: nodes[1] })
            }
        }
        nodeDistances.sort( (a, b) =>  (a.distance > b.distance) ? 1 : -1)

        for (const edgeNode of nodeDistances) {
            // console.log(edgeNode)
            if((0 - MAX_EDGE_SNAP_ANGLE) < (new Helper().calculateAngleFromNodes(node, edgeNode.node) - angle) < ( MAX_EDGE_SNAP_ANGLE ) ) {
                let newAngle = new Helper().calculateAngleFromNodes(node, edgeNode.node)
                if (new Helper().isAngleOkay(node, edgeNode.node, newAngle)) {
                    let newEdge = new Edge(this.stage, {connectingNodes: [node, edgeNode.node], angle: newAngle})
                    node.addEdge(newEdge)
                    edgeNode.node.addEdge(newEdge)
					this.edges.add(newEdge)
					this.nodeDeck.insert(node)
                    return true
                }
            }
        }
        return false
    }

    testIntersection = (position, angle, options) => {
        let defaults = {
            returnIntersections: false,
            bufferWidth: 1,
            bufferDistance: 500
        }
        let intersections = []
        options = setDefaults(options, defaults)
        let offPosX = position.posX + Math.round((options.bufferWidth/3 + 5) * Math.cos(angle * Math.PI / 180))  // offset to avoid outgoing edges from current node
        let offPosY = position.posY + Math.round((options.bufferWidth/3 + 5) * Math.sin(angle * Math.PI / 180))
        let projPosX = position.posX + Math.round(options.bufferDistance * Math.cos(angle * Math.PI / 180))   // edge projected outwards to avoid landing close
        let projPosY = position.posY + Math.round(options.bufferDistance * Math.sin(angle * Math.PI / 180))
        // let line = this.drawLine({posX: offPosX, posY: offPosY}, {posX: projPosX, posY: projPosY}, angle)
        let edges = Array.from(this.edges)
        for (const edge of edges) {
            let positions = edge.getPositions()
            let intersected = intersects.lineLine(offPosX, offPosY, projPosX, projPosY,
                positions[0].posX, positions[0].posY, positions[1].posX, positions[1].posY, options.bufferWidth)
            // this.drawLine({posX: positions[0].posX, posY: positions[0].posY}, {posX: positions[1].posX, posY: positions[1].posY}, edge.angle, 0x8e44ad)
            if (intersected) {
                intersections.push(edge)
            }
            if (intersected && !options.returnIntersections) {
                // line.clear()
                // line = this.drawLine({posX: offPosX, posY: offPosY}, {posX: projPosX, posY: projPosY}, angle, 0xe74c3c)
                return true
            }
        }
        if (!options.returnIntersections) {
            return false
        } else {
            return intersections
        }
    }

    findValidAngle = (node) => {
        let angle = null
        let usedAngles = node.getEdgeAngles()
        let angleSet = new Set()
        angleSet.add(0).add(45).add(90).add(135).add(180).add(225).add(270).add(315)
        let angleDeck = new Tombola().deck( [0, 0, 0, 0, 45, 90, 90, 90, 90, 135, 180, 180, 180, 180, 225, 270, 270, 270, 270, 315] )
        let count = 0
        while (angleSet.size > 0) {
            count += 1
            if (count > 25) {
                throw "LOOP"
            }
            angle = angleDeck.draw()
            if (!usedAngles.has(angle) && angleSet.has(angle)) {
                angleSet.delete(angle)
                if (!this.testIntersection(node.position, angle, {bufferWidth: VALID_ANGLE_BUFFER_WIDTH, bufferDistance: VALID_ANGLE_BUFFER_DIST})) {
                    return angle
                }
            } 
            angleSet.delete(angle)
        }
        return -1
    }


    createRandomNode = (nodeDeck = this.nodeDeck) => {
        let validNode = false
        let angle
        let count = 0
		let selectedNode
		
        selectedNode = nodeDeck.draw()
        while (!validNode) {
            count += 1
            if (count == 10) {
                throw("ERROR")
                validNode = true
            }
            angle = this.findValidAngle(selectedNode)
            // console.log("valid angle", angle)
            if (angle == -1) {
                nodeDeck.insert(selectedNode)
                selectedNode = nodeDeck.draw()
            } else {
                validNode = true
            }
        }
        if (selectedNode == null) {
            console.log("FUKK")
        } else {
            // console.log("selected a node!", selectedNode)
        }
        let options = { distance: new Tombola().range(ROAD_MIN_LENGTH, ROAD_MAX_LENGTH) }
        if (selectedNode && !this.extendEdge(selectedNode, angle)) { // BROKEN
        // if (true) {
            let newPosX = selectedNode.position.posX + Math.round(options.distance * Math.cos(angle * Math.PI / 180))
            let newPosY = selectedNode.position.posY + Math.round(options.distance * Math.sin(angle * Math.PI / 180))
            let newNode = new Node(selectedNode.stage, { posX: newPosX, posY: newPosY })
            let newEdge = new Edge(selectedNode.stage, { connectingNodes: [selectedNode, newNode], angle: angle})
            newNode.addEdge(newEdge)
            selectedNode.addEdge(newEdge)
            if (selectedNode.edgeSet.size < 3 && selectedNode != null) {
                nodeDeck.insert(selectedNode)
            }
            nodeDeck.insert(newNode)
            this.nodes.add(newNode)
			this.edges.add(newEdge)
			return newNode
        }
		// this.tidyUpEdges() 
		return false 
	}

    createNode = (newPosX, newPosY, options) => {
        let newNode = new Node(this.stage, { posX: newPosX, posY: newPosY })
        let angle = Math.round(Math.atan2(newNode.position.posY - options.sourceNode.position.posY,
            newNode.position.posX - options.sourceNode.position.posX) * 180 / Math.PI)
        // this.extendEdge(options.sourceNode, angle)
        // console.log(this.testIntersection({posX: options.sourceNode.position.posX, posY: options.sourceNode.position.posY}, angle, { returnIntersections: true }))
        let newEdge = new Edge(this.stage, { connectingNodes: [options.sourceNode, newNode], angle: angle})
        newNode.addEdge(newEdge)
        options.sourceNode.addEdge(newEdge)
        this.nodes.add(newNode)
        this.edges.add(newEdge)
        if (!options.avoidDeck) {
            this.nodeDeck.insert(newNode)
        }
        this.extendEdge(newNode, angle)
        return newNode

    }

    drawLine = (startPos, endPos, angle, colour = 0x27ae60) => {
        let rectangle = new PIXI.Graphics()
        rectangle.beginFill(colour); // Dark blue gray 'ish
        let distance = Math.hypot(startPos.posX - endPos.posX, startPos.posY - endPos.posY)
        rectangle.drawRect(0, 0, distance, 2); // drawRect(x, y, width, height)
        rectangle.position.set(startPos.posX, startPos.posY)
        rectangle.endFill();
        rectangle.angle = angle
        this.stage.addChildAt(rectangle, 2)
        return rectangle
    }

    drawCircle = (posX, posY, colour=0x27ae60) => {
        let circle = new PIXI.Graphics()
        circle.beginFill(colour)
        circle.drawCircle(0, 0, 10)
        circle.position.set(posX, posY)
        circle.endFill()
        this.stage.addChildAt(circle, 2)
        return circle
    }

	getRandomSocialHub = () => {
		let socialHubs = Array.from(this.socialHubs);
		let randomIndex = Math.floor(Math.random() * socialHubs.length)
		return socialHubs[randomIndex]
	}

	getRandomNode = () => {
		let nodes = Array.from(this.nodes);
		let randomIndex = Math.floor(Math.random() * nodes.length)
		return nodes[randomIndex]
	}

	getRandomFreePlot = (anniversaryNode) => {
		let lonerChance = Math.random() > 0.9

		if(!lonerChance) {
			if(anniversaryNode.availableHousesDeck.contents.length == 0){
				this.expandSuburb(anniversaryNode);
				return anniversaryNode.availableHousesDeck.draw();
			}
			else{
				return anniversaryNode.availableHousesDeck.draw()
			}
		} else {
			let nodes = Array.from(this.nodes)

			if (nodes.length === 0) {
				throw "FUKK, the node set is empty"
			}

			let randomIndex = Math.floor(Math.random() * nodes.length - 1)
			let node = nodes[randomIndex]

			let infiniteLoopCounter = 0

			while (!node)  {
				infiniteLoopCounter++
				randomIndex = Math.floor(Math.random() * nodes.length - 1)
				node = nodes[randomIndex]

				if (infiniteLoopCounter > 100) {
					console.log('Trying to pick a random house. A hundred nodes are null, what the fuck is going on.')
				}

			}

			// console.log(node)
			if (node.availableHousesDeck.contents.length == 0) {
				this.expandSuburb(node)
				let drawnHouse = node.availableHousesDeck.draw();
				// console.log('Drew random house: ', drawnHouse, node)
				return drawnHouse
			} else {
				let drawnHouse = node.availableHousesDeck.draw();
				// console.log('Drew random house: ', drawnHouse, node)
				return drawnHouse
			}
			
		}
		
	}

	//updates the node on it's available houses (spreads out wider as they fill up)
	expandSuburb = (anniversaryNode) => {
		// Get all connecting edges as a Set
		let centralNodes = [];
		let loopingNodes = [anniversaryNode];
		while (centralNodes.length == 0){
			let addedNode = false;
			for (var node of loopingNodes){
				if (node.getNodeVacancies().length > 0){
					centralNodes.push(node);
					addedNode = true;
				}
			} 
			//if we didn't find any nodes with vacant land, we need to expand our nodes
			if (!addedNode){
				var newLoopingNodes = []
				for (var node of loopingNodes){
					newLoopingNodes.push(...Array.from(node.getConnectedNodes()));
				} 
				loopingNodes = newLoopingNodes;
			}
		}
		// Iterate over each edge and place available houses into a Deck
		let housesArray = [];

		for (var centralNode of centralNodes) {
			housesArray.push(...centralNode.getNodeVacancies());
		}

		let housesDeck = new Tombola().deck(housesArray)
		anniversaryNode.availableHousesDeck = housesDeck;
	}


	generateSocialHub = () => {
        let validLocation = true
        let count = 0
        while (validLocation) {
            count ++
            if (count == 100) {
                throw "Cannot generate social hub with current nodeDeck"
            }
            let selectedNode = this.nodeDeck.look()
            for (const hub of this.socialHubs) {
                let dist = new Helper().calculateDistanceFromNodes(hub, this.regions.central)
                let threshold = 0
                if (dist < 1500) {
                    threshold = 300
                } else {
                    threshold = 500
                }
                if (new Helper().calculateDistanceFromNodes(selectedNode, hub) < threshold) {
                    validLocation = false
                    break
                }
            validLocation = true 
        }
        if (!validLocation) {
            console.log("cannot generate social hub with constraints")
            return false
            // selectedNode = this.nodeDeck.draw()
        } else {
            let options = { distance: new Tombola().range(150, 300), direction: this.findValidAngle(selectedNode), nodeType: 'hub' }
            let result = selectedNode.createEdge(options)
            this.edges.add(result.newEdge)
            this.nodeDeck.insert(result.newNode)
            this.nodes.add(result.newNode)
            this.socialHubs.add(result.newNode)
            this.regions.currentHubs.add(result.newNode)
            console.log(this.regions.currentHubs)
            return result.newNode
            // let selectedNode = this.nodeDeck.look()
        }


    }
}

	initPopulation = (populationSize) => {
		let nodesArray = Array.from(this.nodes)

		for (var i = 0; i < populationSize; i++) {
			let randomIndex = Math.floor(Math.random() * nodesArray.length)
			var bot = new Single(this.stage, nodesArray[0], {});
			this.bots.add(bot)
		}
	}

	initCouple = (populationSize) => {
		let nodesArray = Array.from(this.nodes)

		for (var i = 0; i < populationSize; i++) {
			let randomIndex = Math.floor(Math.random() * nodesArray.length)
			var couple = new Couple(_viewport, girlBot, boyBot);
			this.bots.add(couple)
		}
	}
}

module.exports = Map