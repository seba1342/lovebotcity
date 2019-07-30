import Single from './Single.js';
import Bot from './Bot.js';
import Map from './Map.js';
import RootState from './RootState.js';
import { ease } from 'pixi-ease';
const PIXI = require('pixi.js');
const Tombola = require('./math/tombola')
const animationTime = RootState.animationTime;

class Couple extends Bot{
    maxChildren = 4;
    children = new Set();

    constructor(stage, spouse1, spouse2) {
        super(stage, spouse1.node,{
            age : Math.floor(spouse1.age + spouse2.age / 2)
		});
		this.anniversaryNode = spouse1.node;
        this.house = RootState.map.getRandomFreePlot(this.anniversaryNode);
        this.spouse1 = spouse1;
        this.spouse2 = spouse2;
        this.spouse1Satisfaction = spouse1.relationshipSatisfaction;
        this.spouse2Satisfaction = spouse2.relationshipSatisfaction;
        this.relationshipSatisfaction = this.spouse1Satisfaction + this.spouse2Satisfaction;
        this.actions = [ this.moveToRandom, this.moveToHouse, this.moveToHub]
        this.traits = [ 1, 1, 1 ]
        this.relationshipStatus = true

        // Draw Circle
        this.circle = new PIXI.Graphics()
		this.circle.lineStyle(0);
		// Draw first circle
        this.circle.beginFill(spouse1.identity, 1);
        //this.circle.lineStyle(3, spouse2.identity);  //(thickness, color)
		this.circle.drawCircle(-7, 0, 10);
		this.circle.endFill();
		// Draw second circle
		this.circle.beginFill(spouse2.identity, 1);
		this.circle.drawCircle(8, 0, 10);
		this.circle.endFill();
        this.circle.position.set(spouse1.node.position.posX, spouse1.node.position.posY)
        stage.addChild(this.circle)
        //add couple to the botset
		RootState.BotSet.add(this);

    }

    tick() {
        // If the Bot is not busy
        if (!this.house.isHabited) {
            this.moveToHouse()
            this.house.isHabited = true
        }
        if (!this.isBusy) {
          let node = this.state.moveQueue.pop()
          if (node) {
            // If the node is the house, build it (if it's not already built)
            if (node.pseudonode) {
                if (!this.house.isDrawn) {
                    this.house.drawHouse();
                } else if (this.boredom < this.boredomLimit){
                    this.haveSex();
                    this.boredom++;
                }
            }
            this.move(node)
          } else {
			this.boredom = 0;
			if (!this.node) {
				console.log("current node on bot is undefined")
			}
            new Tombola().weightedFunction(this.actions, this.traits)
          }
          this.getOlder();
        }
        this.incrementWaiting()
      }

     
    haveSex() {
        //animate sex
        ease.add(this.circle, { scale: 1.3 }, { duration: animationTime, reverse: true })
        this.wait(animationTime)

        var randomNumber = Math.random();
        var hurdle;
        if (this.age < (this.ageToStartDying / 2)){
            hurdle = 0.8;
        }
        else if(this.age < (this.ageToStartDying /1.8)){
            hurdle = 0.6;
        }
        else if(this.age < (this.ageToStartDying / 1.5)){
            hurdle = 0.5;
        }
        else{
            hurdle = 0.4;
        }
        if (hurdle > randomNumber && this.children.size < this.maxChildren){
            //make a baby
            var genePool = [this.spouse1.identity, this.spouse2.identity];
            var inheritedIdentity = genePool[Math.floor(Math.random() * genePool.length)];
            var baby = new Single(this.stage, this.node, {age:0, identity:inheritedIdentity});
            this.children.add(baby);
            RootState.BotSet.add(baby);
            return baby;
        }
        else{
            return false;
        }
    }

    getOlder(){
        this.age++;
        //if they're unlucky, they die (chance increases each year)
		var randomValue = Math.random();
		if (this.age > this.ageToStartDying) {
			if (randomValue < ((this.age - this.ageToStartDying) / this.invincibility)){
                this.alive = false;
				this.circle.destroy();
				RootState.BotSet.delete(this)
			}
		}
    }

    moveToRandom = () => {
        this.moveToNode(RootState.map.getRandomNode(), {});
    }

    moveToHub = () => {
        this.moveToNode(this.anniversaryNode, {});
    }

    moveToHub = () => {
        this.moveToNode(this.anniversaryNode, {})
    }

    moveToHouse = () => {
        // Determine the shortest route to the house plot by checking distance to both edge nodes
        let node1 = Array.from(this.house.edge.edgeNodes)[0]
        let node2 = Array.from(this.house.edge.edgeNodes)[1]
        let route1 = RootState.map.pathFinder.pathTo(this.node, node1);
		let route2 = RootState.map.pathFinder.pathTo(this.node, node2);
        let destination;
        route1.length > route2.length ? destination = node2 : destination = node1;
        let options = {};
        options.finalPosition = { bots: new Set(), position : { posX: this.house.posX, posY: this.house.posY }, pseudonode: true }
        this.moveToNode(destination, options)
    }
}

export default Couple;
