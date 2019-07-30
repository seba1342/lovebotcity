class Helper{
    constructor() {}
    calculateAngleFromNodes = (sourceNode , destNode) => {
        return Math.atan2(destNode.position.posY - sourceNode.position.posY,
            destNode.position.posX - sourceNode.position.posX) * 180 / Math.PI
    }
    
    calculateDistanceFromNodes = (sourceNode, destNode) => {
        return Math.hypot( destNode.position.posX - sourceNode.position.posX, destNode.position.posY - sourceNode.position.posY )
    }

    isAngleOkay = (node, destNode) => {
        let angle = this.calculateAngleFromNodes(destNode, node)
        let destAngles = destNode.getEdgeAngles()
        for (const edgeAngle of destAngles) {
            if (Math.abs(angle - edgeAngle) < 45) {
                return false
            }
        } 
        return true
    }
    
    calculateCoordsFromVector = (source, angle, distance) => {
        let posX = source.position.posX + distance * Math.cos(angle * Math.PI / 180)
        let posY = source.position.posY + distance * Math.sin(angle * Math.PI / 180)
        
        return {posX, posY}
    }
	
	calculateDistanceToEdge(node, edge) {
		let nodes = edge.getNodes()
		let dist = this.calculateDistanceFromNodes(nodes[0], nodes[1])
		let angle = this.calculateAngleFromNodes(nodes[0], nodes[1])
		let posX = nodes[0].position.posX + dist * Math.cos(angle * Math.PI / 180)
		let posY = nodes[0].position.posY + dist * Math.sin(angle * Math.PI / 180)
		return this.calculateDistanceFromNodes(node, {position: {posX: posX, posY: posY}})
	}
}

module.exports = Helper