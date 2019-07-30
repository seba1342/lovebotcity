import Couple from './Couple.js';
import Bot from './Bot.js';
import RootState from './RootState'
import Colours from './Colours.js';
const colours = new Colours();
const _ = require('underscore');
const PIXI = require('pixi.js');
const Tombola = require('./math/tombola')
import { ease } from 'pixi-ease'
const legalAge = 18;

const animationTime = RootState.animationTime;
const numberOfColours = Colours.numColours;
//every milestoneYears years they will lower their standards
const milestoneYears = 50;

class Single extends Bot {
    personalRelationshipSatisfaction = null; //instantiated with a successful proposal
    // alive = true; //changed if they die
    constructor(stage, node, options) {
        super(stage, node, options);
        this.targetIdentity = colours.getInitialTargetColours(this.identity) //gives their subpallet
        this.actions = [ this.moveToRandom ]
        this.traits = [ 1 ]
        this.relationshipStatus = false
        
        // Draw Circle
        this.circle = new PIXI.Graphics();
        this.circle.lineStyle(0);
        this.circle.beginFill(this.identity, 1);
        // this.circle.lineStyle(3, this.targetIdentity);  //(thickness, color)
        this.circle.drawCircle(0, 0, 5);
        this.circle.endFill();
        this.circle.position.set(this.posX, this.posY)
        stage.addChild(this.circle)
	}
	
	tick() {
		// If the Bot is not busy
		if (!this.isBusy) {
			let node = this.state.moveQueue.pop()
			if (node) {
				this.move(node)
			} else if (this.node.isHub && this.boredom < this.boredomLimit && this.age >= legalAge) {
				this.mingle() //increments boredom
			} else {
                this.boredom = 0;
				new Tombola().weightedFunction(this.actions, this.traits)
			}
			this.getOlder();
		}
		this.incrementWaiting()
	}

	//returns target identity array index if target identity suits the candidate's actual identity, -1 if not
	//therefore a low return value (like 0, or 1) would mean a really good match. A high one would mean they're getting desperate
	getCompatability(otherSingleBot) {
		var identityApproval = this.targetIdentity.indexOf(otherSingleBot.identity);
		return identityApproval;
		//return 0; //DONT PUSH
	}

	mingle() {
		for (let bot of this.node.bots) {
			if (bot !== this && !bot.isBusy && !bot.relationshipStatus && bot.alive && this.alive) {
				this.propose(bot)
			}
		}
		this.boredom++;
	}

	propose(otherSingleBot) {
		if (this.getCompatability(otherSingleBot) > -1) {
			if (otherSingleBot.getCompatability(this) > -1) {
				this.personalRelationshipSatisfaction = numberOfColours - this.getCompatability(otherSingleBot);
				otherSingleBot.personalSatisfaction = numberOfColours - otherSingleBot.getCompatability(this);
				let couple = new Couple(this.stage, this, otherSingleBot);
				//they are no longer alive
				this.alive = false;
				otherSingleBot.alive = false;
				// Delete the Single bots from the node they are in before killing them
				this.node.bots.delete(this)
				this.node.bots.delete(otherSingleBot)
				//remove single circles from map
				this.stage.removeChild(this.circle);
				this.stage.removeChild(otherSingleBot.circle);
				this.circle.destroy();
				otherSingleBot.circle.destroy();
				//Then remove them from the big array
				RootState.BotSet.delete(this);
				RootState.BotSet.delete(otherSingleBot);
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}
    moveToHub = () => {
        this.moveToNode(RootState.map.getRandomSocialHub(), {})
    }

    //moves to a random node but not a hub - 
    //cause they shouldnt go to hubs without the moveToHub action, which they get when they're old enough
    moveToRandom = () => {
        let randomNode = RootState.map.getRandomNode();
        while (randomNode.isHub){
            randomNode = RootState.map.getRandomNode();
        }
        this.moveToNode(randomNode, {})
    }

    //returns direct reference to the other partner in the relationship (the partner not passed in as argument)
    getOtherPartner(partner){
        if(this.spouse1 == partner){
            return this.spouse2;
        }
        else if(this.spouse2 == partner){
        return this.spouse1;
        }
        else{
            throw "CALLING PARTNER IS NOT EITHER PARTNER IN RELATIONSHIP"
        }
        this.moveToNode(randomNode, {})
    }

    //should be called every 'year' 
    //every 'milestoneYears' years a new colour is added to their target identity
    //death - changes alive attribute of self (and of partner if they have one)
    getOlder(stage){
        this.age += 1;
        //if they hit a milestone, they get a new target ('acceptable') colour/identity
        if (this.age % milestoneYears == 0){
            var newTargetColourInserted = false;
            while (newTargetColourInserted == false && this.targetIdentity.length < numberOfColours){
                newColour = colours.getRandomColour();
                if (this.targetIdentity.indexOf(newColour) == -1){
                    this.targetIdentity[this.targetIdentity.length] = newColour;
                    newTargetColourInserted = true;
                }
            }
        }
        if (this.age == legalAge){
            this.actions.push(this.moveToHub);
			this.traits.push(10);
			if(this.alive) {
				ease.add(this.circle, { scale: 2 }, { duration: 1000, reverse: false })
			}
        }
        if (this.age > this.ageToStartDying){
            //if they're over 30, and unlucky, they die (chance increases each year)
            var randomValue = Math.random();
            if (randomValue < ((this.age - this.ageToStartDying) / this.invincibility)){
                this.alive = false;
                this.circle.destroy();
                this.stage.removeChild(this.circle)
                RootState.BotSet.delete(this)
            }
        }
    }
}

export default Single;