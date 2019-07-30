import Colours from './Colours.js';
const colours = new Colours();
const _ = require('underscore');
const PIXI = require('pixi.js')
import { Ease, ease } from 'pixi-ease'
import { State } from 'pixi.js';
import RootState from './RootState.js';
const Tombola = require('./math/tombola')


function setDefaults(options, defaults){
    return _.defaults({}, _.clone(options), defaults);
}

const numberOfColours = Colours.numColours;
//every milestoneYears years they will lower their standards
const milestoneYears = 10;
// Adjusts the speed of the animation, determines how long to wait for in ticker
const animationTime = 1000;


class Bot {
    // alive = true; //changed if they die
    //called in sub classes getOlder, higher number = less chance of dying year to year
	invincibility = 20000;
	ageToStartDying = 80;
    constructor(stage, node, options) {
        this.stage = stage
        let defaults = {
            alive: true,
            age: 0,
            identity:colours.getRandomColour(),
            isBusy: false,
        }
        options = setDefaults(options, defaults)

        this.alive = options.alive;
        this.age = options.age;
        this.identity = options.identity;
        this.node = node;
        this.posX = this.node.position.posX;
        this.posY = this.node.position.posY;
        this.isBusy = false
        this.tickData = { remaining: 0 , queue: null }
        this.state = { moveQueue: [], actionQueue: [] }
        this.boredomLimit = 20;
        this.boredom = 0; //when they do boring tasks (mingle unsuccessfully, sit at home/have sex) this increments
    }

    //returns current shape position
    getPosition = () => {
      return this.circle.position
    }

    //this function is overridden in both single and couple. 
    tick() {
	  // If the Bot is not busy
      if (!this.isBusy) {
        let node = this.state.moveQueue.pop()
        if (node) {
          this.move(node)
        } else {
          new Tombola().weightedFunction(this.actions, this.traits)
        }
        // this.getOlder();
      }
      this.incrementWaiting()
    }

    wait = (ticks) => {
      ticks = Math.round(ticks / 100)
      this.tickData.remaining += ticks
    }

    incrementWaiting = () => {
      if (this.tickData.remaining > 0) {
        this.tickData.remaining -= 1
        this.isBusy = true
      }
      else {
        this.isBusy = false
      }
    }

    moveToNode(node, options) {
      // If there is a house location in the movement path, move to that location
      if (options.finalPosition) {
        this.state.moveQueue.push(node)
        this.state.moveQueue.push(options.finalPosition)
        this.state.moveQueue.push(...RootState.map.pathFinder.pathTo(node, this.node))
      } else {
		if (!node) {
			console.log("current node on bot is undefined")
			throw ("err")
		}
        this.state.moveQueue.push(...RootState.map.pathFinder.pathTo(node, this.node))
      }
    }

    move(nextNode) {
      ease.add(this.circle, { x: nextNode.position.posX, y: nextNode.position.posY }, { duration: animationTime, reverse: false })
      this.wait(animationTime)
      this.node.bots.delete(this)
      if (this.node.isHub) {
        this.node.resize()
      }
      this.node = nextNode
      this.node.bots.add(this)

      if (this.node.isHub) {
        this.node.resize()
      }
      // moveBot.on('complete', () => this.isBusy = false)
    }

    //TODO - this will have all of the allowable actions, logic to pick an action, called by tick
    act(){
      var actions = [this.move, this.chill];
      return;
    }
}

export default Bot;
