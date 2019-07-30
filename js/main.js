import Ticker from './Ticker'
import Single from './Single.js';
import Couple from './Couple.js';
import { ease } from 'pixi-ease'
import DomEase from 'dom-ease'
import { State } from 'pixi.js';
import RootState from './RootState.js';
import Tombola from './math/tombola'

const PIXI = require('pixi.js')
const Viewport = require('pixi-viewport').Viewport
const Node = require('./Node')
const Map = require('./Map')
const BORDER = 10
const WIDTH = 3000
const HEIGHT = 3000
const OBJECT_SIZE = 50
const OBJECT_ROTATION_TIME = 1000
const FADE_TIME = 2000

let _application, _viewport, _object, _stars = [], domEase

function viewport()
{
    _viewport = _application.stage.addChild(new Viewport(
    {
        interaction: _application.renderer.plugins.interaction,
        passiveWheel: false,
    }))
    _viewport
        .drag({ clampWheel: true })
        .wheel({ smooth: 3, percent: 0.2 })
        .pinch()
        .decelerate()
        .on('clicked', click)
    resize()

    domEase = new DomEase({ duration: FADE_TIME })
    ease.duration = FADE_TIME
}

function resize()
{
    _application.renderer.resize(window.innerWidth, window.innerHeight)
    _viewport.resize(window.innerWidth, window.innerHeight, WIDTH, HEIGHT)
}

function border()
{
    const line = _viewport.addChild(new PIXI.Graphics())
    line.lineStyle(10, 0xff0000).drawRect(0, 0, _viewport.worldWidth, _viewport.worldHeight)
}

function object()
{
    _object = _viewport.addChild(new PIXI.Sprite())
    // _object.anchor.set(0.5)
    // _object.tint = 0
    // _object.width = _object.height = OBJECT_SIZE
    // _object.position.set(100, 100)
    // ease.add(_object, { rotation: Math.PI * 2 }, { duration: OBJECT_ROTATION_TIME, repeat: true, ease: 'linear' })
}

function click(data)
{   

	const style = new PIXI.TextStyle({
		fontFamily: "Arial",
		fontSize: 81,
		fill: "black",
	})

	const emojiDeck = new Tombola().deck( ['😍', '😎', '👽', '🍑', '☕', '🔥', '💯', '❤️', '💕', '🍆', '🤔', '👀', '💪', '👻'] )

    const emoji = _viewport.addChild(new PIXI.Text(emojiDeck.draw(), style))
	emoji.anchor.set(0.5)
    emoji.position = data.world
    const fade = ease.add(emoji, { alpha: 0 })
    fade.on('done', () => _viewport.removeChild(emoji))
}

function drawWorld()
{
    ease.removeAll()
    _viewport.removeChildren()
    object()
    _viewport.moveCenter(0, 0)
}

window.onload = function()
{
    _application = new PIXI.Application({ transparent: true, width: window.innerWidth, height: window.innerHeight, resolution: window.devicePixelRatio})
    document.getElementById("canvas").appendChild(_application.view)
    _application.view.style.position = 'fixed'
    _application.view.style.width = '100vw'
	_application.view.style.height = '100vh'

    viewport()

    window.addEventListener('resize', resize)

    drawWorld()

    // border()

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
          if ((new Date().getTime() - start) > milliseconds){
            break;
          }
        }
      }

    let m = new Map(_viewport)
	RootState.map = m;
	// let a = m.createNode(0, 0, {sourceNode: m.walls.nodes[2] })
    // let b = m.createNode(600, 600, {sourceNode: a})
    // let c = m.createNode(500, 300, {sourceNode: b})
    // let d = m.createNode(400, 250, {sourceNode: c})

    // m.drawLine()

    const ticker = new Ticker(m)
    window.setInterval(function(){
		// m.createRandomNode()
		//let freePlot = m.getRandomFreePlot()

		// if(freePlot) {
		// 	freePlot.drawHouse()
		// }
		m.socialHubsRegionStatus()
	  }, 1000 )

    for (let i=0; i <1; i++) {
        m.createRandomNode()
		m.generateSocialHub();
    }
    
    // Set initial viewport zoom (70% zoomed)
    _viewport.setZoom(0.7)

    // Zoom out a tiny amount every 1ms
    window.setInterval(function(){
        if (_viewport.hitArea.height < 5600) {
            _viewport.zoom(0.05)
        }
    }, 1)

    m.initPopulation(200)

}

