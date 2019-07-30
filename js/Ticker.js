class Ticker {
    constructor(map) {
        this.map = map
        // Set timeSpeed to a high number to slow down the simulation.
        this.tickSpeed = 100
        this.counter = 0
        this.intervalId = this.startTicker()
    }

    tick = () => {
        for (let bot of this.map.bots) {
            if (bot.alive) {
				bot.tick()
            }
		}
		// if (this.map.bots.size == 0) {
		// 	window.alert("All bots are dead :(")
		// }

		this.counter++;
		if(this.counter==1){
			//after exactly one round of ticks on all bots, the edge that runs into town ('source')
			//will be removed from the edge set so that no one can walk on it or build a house on it
			//TODO - remove the source edge/node from the map functionality
		}
    }

    startTicker = () => {
        window.setInterval(
            this.tick.bind(this), this.tickSpeed
		)
    }

    stopTicker = (intervalId) => {
        window.clearInterval(intervalId)
    }
}

module.exports = Ticker;
