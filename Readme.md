
# PointerInputs

This is working code to handle multi-touch inputs in browser using PointerEvents. It is for learning and development, aimed at further modification for other uses. For turnkey libraries for specific purposes see the [[#Other good stuff out there]] section.

## Demo
- [demo0](https://pycheung.com/PointerInputs/demo0.html)
- [demo1](https://pycheung.com/PointerInputs/demo1.html) 
	- ![](assets/demo1.png)
 images from [unsplash](https://unsplash.com/) API for random images [License](License https://unsplash.com/license). 
	- Also see [Microsoft multi-touch demo back in 2007](https://www.popularmechanics.com/technology/gadgets/a1690/4217348/)

## Usage
```javascript
var ir = new PointerInputs();

ir.settings = {
			        class: "touch",
			        main: "touch-main",
			        container: "touch-container",
			        notransition: "notransition",
			        rotate: true,
			        scale: true,
			        move: true,
			        limit: true
			    }

```

Basic setup
```html
<div class="touch-main">
	<div class="touch-container">
		<div class="touch-item">
			<div id="current1" class="touch">current1</div>
		</div>
	</div>
</div>
```
- Event listeners are added to each .touch-main onload, handles new items within touch-main when added in runtime.
- .touch-container is used for limiting the position of the touch item - i.e. when dragged outside the container, to return within the bounds if the item is smaller than the container.
- An optional .touch-item is used (see css) for the initial position to be relative to the rest of the page.
- .touch are the elements that response to pointer events, 

```css
/*this is the container for elemments, can be used as constraint*/
.touch-container{
    width:50%;
    height:200vh;
    margin: 0 auto;
    border:1px solid #fc0;
}
/*so that elem.touch can be positioned relative to the rest of the document*/
.touch-item{
    position:relative;
    display:block;
    width:500px;
    height:300px;
    touch-action: none;
    pointer-events: none;
    border:2px dashed #000;
    margin:1em;
}
/*this is the elem that will be transformed*/
.touch{
    background: #ccc;
    width:100%;
    height:100%;
    position:absolute;
    top:0;
    left:0;
    touch-action: none; /* need this to avoid touchcancel */
    pointer-events: all;
    transform-origin: center center;
    transition: transform 0.1s ease-in;
}
/*a class to prevent animation while dragging*/
.notransition{
    transition: none !important;
}
```

additional css
```css
html,body{
	/* prevent windows chrome swipe left and right goes back/forward in browser history*/
    overscroll-behavior-x: none; 
}
```

## Dev log

### MouseEvent+TouchEvent and PointerEvent
MouseEvent 
- mousedown
- mousemove
- mouseup
no multiple pointers

TouchEvent
https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
touchevents in safari appears not supported
- touchdown
- touchmove
- touchup
multiple pointers in event.touches

PointerEvent
https://dev.to/stephencweiss/replacing-mouseevents-with-pointerevents-5485
https://javascript.info/pointer-events
https://caniuse.com/?search=pointerdown
It appears most modern browser supports it.
- pointerdown
- pointermove
- pointerup
- pointercancel

https://usefulangle.com/post/27/javascript-advantage-of-using-pointer-events-over-mouse-touch-events
Working with PointerEvent here.

### Notes

#### PointerEvent specific
events fires differently in different browsers
in chrome dev tool 
touch event id increments
pointercancel fires when mousedown drag up, pointerup does not fire

in firefox dev tool 
touch event id remains as 0
pointercancel does not fire
pointerup always fire

Prevent the default browser action to avoid pointercancel, for mouse events set:
```javascript
element.ondragstart = ()=>false;
```
for touch events set css
```css
element { touch-action: none }
```
on windows chrome (and perhaps other browsers)
gesture can be used to go back in the browser history
can be disabled using css
https://stackoverflow.com/questions/15829172/stop-chrome-back-forward-two-finger-swipe
does not prevent back gesture on ipad safari

#### Handleing width and height
find the relative top to page
https://caniuse.com/getboundingclientrect

dimension without scrollbar
document.documentElement.clientWidth 
document.documentElement.clientHeight 

dimension with scrollbar
window.innerWidth 
window.innerHeight 

full height of the document
document.documentElement.scrollHeight

## Other good stuff out there
### mouse touch pointer events with d3
https://observablehq.com/@d3/multitouch
One of the best demo online, used within the d3 ecosystem

### Interactjs
https://interactjs.io/
nice stuff here, and for a bit of history see https://hacks.mozilla.org/2014/11/interact-js-for-drag-and-drop-resizing-and-multi-touch-gestures/

### Hammerjs
https://hammerjs.github.io/

### shopify/draggable
https://github.com/Shopify/draggable

