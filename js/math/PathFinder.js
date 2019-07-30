const _ = require('underscore')
const PriorityQueue = require('../javascript-algorithms/data-structures/priority-queue/PriorityQueue.js').default;

function setDefaults(options, defaults){
    return _.defaults({}, _.clone(options), defaults)
}

class PathFinder {
    constructor(options) {
        let defaults = {
            nodeSet: null,
            edgeSet: null,
            hubSet: null
        }
        this.nodes = {}
        options = setDefaults(options, defaults)
        this.nodeSet = options.nodeSet
        this.edgeSet = options.edgeSet
        this.hubSet = options.hubSet
    }

    pathTo = (source, destination) => {
        let distances = new Map()
        let previousVerticies = new Map()
        let visited = new Map()
        let queue = new PriorityQueue()
        
        for (const node of this.nodeSet) {
            distances.set(node, Infinity);
            previousVerticies.set(node, null);
        }

		distances.set(source, 0);
		
		if (!source) {
			console.log("pathfinder source is not defined")
		}

		queue.add(source, distances.get(source))

        let currentNode
        while (!queue.isEmpty()) {
            currentNode = queue.poll()
            Array.from(currentNode.getConnectedNodes()).forEach( (neighbour) => {
                if (!visited.get(neighbour)) {
                    const existingDistance = distances.get(neighbour)
                    const newDistance = distances.get(currentNode) + 1
                    if (newDistance < existingDistance) {
                        distances.set(neighbour, newDistance)

                        if (queue.hasValue(neighbour)) {
                            queue.changePriority(neighbour, distances.get(neighbour))
                        }
                        previousVerticies.set(neighbour, currentNode)
                    }
                    if (!queue.hasValue(neighbour)) {
                        queue.add(neighbour, distances.get(neighbour))
                    }
                }
            })
			visited.set(currentNode, currentNode)
			let count = 0
            if (currentNode == destination) {
                let result = []
                let current = currentNode
                result.push(current)
                while (current != source) {
					if (count == 100) {
						break
					}
					count += 1
                    current = previousVerticies.get(current)
                    result.push(current)
                }
                result.reverse()
                return result
            }
        }
        // let result = []
        // let current = currentNode
        // result.push(current)
        // while (current != source) {
        //     current = previousVerticies[current]
        //     result.push(current)
        // }
        // result.reverse()
        // return result
    }

}

module.exports = PathFinder

