/*
PointerInputs Oct 2022 eric.pycheung
*/
function PointerInputs(){
    var scope = this;
    //note: guide says to attach it to the element themselves instead of the higher level dom
    scope.settings = {
        class: "touch",
        main: "touch-main",
        container: "touch-container",
        notransition: "notransition",
        debugpoint: "debug-point",
        rotate: true,
        scale: true,
        move: true,
        limit: true
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // add event listeners
    function setListener(elem){
        // var elem = document.getElementById("main");
        elem.addEventListener("pointerdown",inputEvent);
        elem.addEventListener("pointermove",inputEvent);
        elem.addEventListener("pointerup",inputEvent);
        elem.addEventListener("pointercancel",inputEvent);
        //Prevent the default browser action to avoid pointercancel.
        elem.ondragstart = false;
        //Prevent two finger touch on windows acts like right click
        // elem.oncontextmenu = (e)=>{e.preventDefault();return false;}; 
        elem.onselectstart = (e)=>{e.preventDefault();return false;}; //disable selection on touch devices

        // elem.addEventListener("pointerover",debugEvent); //does not fire in touch mode
        // elem.addEventListener("pointerenter",debugEvent);
    }

    const mains = document.querySelectorAll('.'+scope.settings.main);
    mains.forEach(main => { setListener(main); });

    //note new items within scope.settings.main added in runtime is handled
    //need to set these when there are new scope.settings.main containers

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // pointerCache -need to cache the state of pointer per element
    /*
    keep an array of touched points per element
    on pointerdown register the touch point using the pointerId
    on pointerup remove the touch point using the pointerId
    */
    let pointerCache = {}; //elem.id:[{pointerId}]
    scope.pointerCache = pointerCache;
    function findTarget(elem){
        const target = elem.closest("."+scope.settings.class);
        if (target == null || target.id == "") {return null};
        return target;
    }

    function initPointer(e,init=true){
        var target = findTarget(e.target);
        if (target == null){return null;}

        // console.log(e.target.classList)
        if (!target.classList.contains(scope.settings.class)){return null;} // only operate on elements with the class
        const elemid = target.id;
        if (pointerCache[elemid] == null) { 
            if( init == false ) {return null;}
            //find the container
            const container = target.closest("."+scope.settings.container); //returns null if there isnt any, note: need polyfill
            // if(container) { container.style.background = '#fc0';}
            
            const currenttransform = getTransform(target);
            pointerCache[elemid] = {
                pointlist:[],
                data:{
                    angle:currenttransform.angle,
                    pointerangle:0,
                    point:currenttransform.point,
                    meanpoint:{x:0,y:0},
                    scale:currenttransform.scale, //assume x and y are the same
                    distance:0,
                    active:false,
                    zindex:1,
                    container:container
                }
            };
        }
        return pointerCache[elemid];
    }
    function addPointer(e){
        // if (e.target.id == ""){return;}
        var target = findTarget(e.target);
        if (target == null){return null;}

        const elemid = target.id;
        let data = initPointer(e);
        if(data == null){return;}
        // pointerCache[elemid].push(e); //contains read only elements
        // console.log(e.offsetX,e.offsetY)
        data.pointlist.push({
            pointerId:e.pointerId,
            isPrimary:e.isPrimary,
            dx:0,
            dy:0,
            pageX:e.pageX,
            pageY:e.pageY,
            offsetX:e.offsetX,
            offsetY:e.offsetY,
        });//create a new object for modification during pointermove
    }
    function removePointer(e){

        var target = findTarget(e.target);
        if (target == null){return null;}

        const elemid = target.id;
        const index = pointerCache[elemid].pointlist.findIndex((point)=>{
            if (point.pointerId == e.pointerId){ return true; }
        });
        // if (pointerCache[elemid].pointlist.length == 1){
        //     delete pointerCache[elemid]; //do not delete to keep track of position, angle and scale
        //     return;
        // }
        pointerCache[elemid].pointlist.splice(index,1);
        //clean up
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Pointer events
    function pointerdown(e){

        var target = findTarget(e.target);
        if (target == null){return null;}

        // console.log(e.target)
        let elempointer = initPointer(e); //create cache if hasnt init
        if (elempointer == null){ return; }

        let pointlist = elempointer.pointlist;
        let current = elempointer.data;
        target.setPointerCapture(e.pointerId);
        addPointer(e);
        //set initial angle and point on the element
        if (pointlist.length > 1){
            current.pointerangle = Math.atan2(pointlist[1].pageY-pointlist[0].pageY,pointlist[1].pageX-pointlist[0].pageX);
            current.meanpoint = getMeanPoint(pointlist,current.point);
            current.distance = Math.hypot(pointlist[1].pageY-pointlist[0].pageY,pointlist[1].pageX-pointlist[0].pageX);
        }
        else{
            current.meanpoint = {x:pointlist[0].pageX,y:pointlist[0].pageY};
        }
        current.active = true;
        moveAbs(scope.settings.debugpoint,current.meanpoint.x,current.meanpoint.y);
        
        if(e.isPrimary){
            bringToFront(target);
        }
        target.classList.add(scope.settings.notransition);
    }
    function pointermove(e){
        // console.log(e.type, e.target.id)
        let elempointer = initPointer(e,false); //do not create cache if it hasnt init
        if (elempointer == null){ return; }
        let pointlist = elempointer.pointlist;
        let current = elempointer.data;
        
        if(current.active == false){return};
        let point = pointlist.find((point)=>{if(point.pointerId === e.pointerId){return point;}});
        if (!point){return;}
        
        //set the per pointer movementXY
        // console.log(e.movementX,e.movementY); //while avaliable on chrome and FF, these are not in specs?
        point.dx = e.pageX - point.pageX;
        point.dy = e.pageY - point.pageY;
        point.pageX = e.pageX
        point.pageY = e.pageY

        //when there are two pointers on the element
        if (pointlist.length == 2){
            if(point == pointlist[0]){

                //rotate using the angle differences
                if (scope.settings.rotate == true){
                    current.angle -= current.pointerangle;
                    current.pointerangle = Math.atan2(pointlist[1].pageY-pointlist[0].pageY,pointlist[1].pageX-pointlist[0].pageX);
                    current.angle += current.pointerangle;
                    // console.log(angle);
                    // e.target.style.transform = `rotate(${current.angle}rad) `;
                }

                //scale using the distance differences
                if (scope.settings.scale == true){
                    current.scale /= current.distance;
                    current.distance = Math.hypot(pointlist[1].pageY-pointlist[0].pageY,pointlist[1].pageX-pointlist[0].pageX);
                    current.scale *= current.distance;
                    // e.target.style.transform = `scale(${current.scale}) `;
                }
            }
        }

        //move by drag on an absolute positioned div
        if(point == pointlist[0] && scope.settings.move == true){
            if (pointlist.length == 1){
                // e.target.style.left = e.target.offsetLeft+point.dx +'px';
                // e.target.style.top = e.target.offsetTop+point.dy +'px';
                moveAbs(scope.settings.debugpoint,e.pageX,e.pageY);

                current.point.x += point.dx;
                current.point.y += point.dy;
            }
            else{
                var meancurrent = getMeanPoint(pointlist);
                var dx = meancurrent.x - current.meanpoint.x;
                var dy = meancurrent.y - current.meanpoint.y;
                current.meanpoint = meancurrent;

                moveAbs(scope.settings.debugpoint,current.meanpoint.x,current.meanpoint.y);
                // e.target.style.left = e.target.offsetLeft+dx +'px';
                // e.target.style.top = e.target.offsetTop+dy +'px';
                current.point.x += dx;
                current.point.y += dy; 
            }
        }

        //note: current.point is relative to the container
        setTransform(e.target,current.point.x,current.point.y,current.angle,current.scale);
    }
    function pointerup(e){

        var target = findTarget(e.target);
        if (target == null){return null;}
        
        if(target.hasPointerCapture(e.pointerId)){
            target.releasePointerCapture(e.pointerId);
        }

        let elempointer = initPointer(e,false);
        if (elempointer == null){ return; }
        
        let pointlist = elempointer.pointlist;
        const current = elempointer.data;
        current.active = false;
        removePointer(e);

        let point = pointlist.find((point)=>{if(point.pointerId === e.pointerId){return point;}});
        if(point == pointlist[0] && scope.settings.limit == true){ //only do it once per element
            //add addition checks for constraints
            containBoxAbsolute(target,current);
        }
        target.classList.remove("notransition");
    }
    function inputEvent(e){
        e.preventDefault();
        // e.stopPropagation();
        switch (e.type){
            case "pointerdown":
                pointerdown(e);
                break;
            case "pointermove":
                pointermove(e);
                break;
            case "pointerup":
                pointerup(e);
                break;  
            case "pointercancel":
                pointerup(e);
                break;  
            default:
                console.log(e.type, "not handled");
        }

        displayCache();
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////
    function containBoxAbsolute(elem,current){
        //move it back into container in absolute coords
        //note: limited to translate and items that is smaller than the container
        const pos = pageXY(elem);
        let adjust = false;
        if (current.container == null){return;}
        // const container = current.container.getBoundingClientRect();
        const container = pageXY(current.container); //can be cached, but need to update on resize
        // const container = {top:0,left:0,width:document.documentElement.clientWidth,height:document.documentElement.clientHeight};
        // const container = {top:50,left:50,width:1000,height:500};
        // console.log(container);

        //note: this happens when the container dom has no height - i.e. all its child nodes are absolute
        if (container.height == 0){ container.height = document.documentElement.clientHeight}

        //to add: when the overall bounding box height is greater than container height

        // moveAbs(scope.settings.debugpoint,pos.left,pos.top);
        if(pos.top < container.top){
            current.point.y += container.top-pos.top;
            adjust = true;
        }
        if(pos.left < container.left){
            current.point.x += container.left-pos.left;
            adjust = true;
        }

        //limit right and bottom
        // if (pos.left+pos.width > container.width+container.left){
        //     current.point.x += (container.width+container.left) - (pos.left+pos.width)
        //     adjust = true;
        // }
        // if (pos.top+pos.height > container.height+container.top){
        //     current.point.y +=  (container.height+container.top) - (pos.top+pos.height)
        //     adjust = true;
        // }
        if(adjust){
            setTransform(elem,current.point.x,current.point.y,current.angle,current.scale);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // util 
    //find the mean point when there are more than one input points
    function getMeanPoint(pointlist,original){
        let meanpoint={x:0,y:0};
        if(pointlist.length <= 1){
            return original; //return default
        }
        for(var each of pointlist){
            meanpoint.x += each.pageX;
            meanpoint.y += each.pageY;
        }
        meanpoint.x /= pointlist.length;
        meanpoint.y /= pointlist.length;
        return meanpoint;
    }
    //get the transform and decompose matrix for translatexy, rotation and scale value
    function getTransform(element) {
        const style = window.getComputedStyle(element);
        const matrix = new DOMMatrixReadOnly(style.transform);
        //https://stackoverflow.com/questions/15022630/how-to-calculate-the-angle-from-rotation-matrix
        //https://stackoverflow.com/questions/16359246/how-to-extract-position-rotation-and-scale-from-matrix-svg
        // console.log(matrix)
        return {
            point: {x: matrix.m41,y: matrix.m42} ,
            angle: -Math.atan2(matrix.m21,matrix.m11),
            scale: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
        }
    }
    function setTransform(elem,x,y,angle,scale){
        elem.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad) scale(${scale})`;
    }
    function bringToFront(elem){
        //bring elem to top amongst all with class touch
        var all = Array.from(document.querySelectorAll("."+scope.settings.class));
        all.filter((a)=>{return a != elem});
        all.sort((a,b)=>{a.style.zIndex-b.style.zIndex});
        all.push(elem);
        for(var i = 0; i < all.length;i++){
            all[i].style.zIndex = i+10;
        }
    }
    scope.bringToFront = bringToFront;
    
    //find absolute position of an element
    function pageXY(elem){
        //https://stackoverflow.com/questions/5598743/finding-elements-position-relative-to-the-document
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docEl = document.documentElement;
        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;
        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return { top: Math.round(top), left: Math.round(left), width:box.width, height:box.height };
    }
    //https://stackoverflow.com/questions/22119673/find-the-closest-ancestor-element-that-has-a-specific-class
    function findAncestor (el, sel) {
        while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el,sel)));
        return el;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////
    function displayCache(){
        const debug = document.getElementById("debug");
        if(!debug){return;}
        let cachestr = "";

        for(var key in pointerCache){
            var data = pointerCache[key];
            cachestr += `Total active points: ${data.pointlist.length} on ${key} <br>`;
            cachestr += `<table class=test>`;
                cachestr += `<tr><td>pointerId</td><td>dx</td><td>dy</td><td>isPrimary</td></tr>`;
            for(var point of data.pointlist){
                // for(var key in point){
                    // e.target.innerHTML += `${key}:${point[key]}<br>`;
                // }
                cachestr += `<tr><td>${point.pointerId}</td><td>${point.dx}</td><td>${point.dy}</td><td>${point.isPrimary}</td></tr>`;
            }
            cachestr += `</table>`;
        }
        debug.innerHTML = cachestr;
    }
    //move one div to show where the inputs are, for visual debug
    function moveAbs(domid,x,y){
        if (domid == null) {return;}
        try{
            document.getElementById(domid).style.left = (x-6)+"px";
            document.getElementById(domid).style.top = (y-6)+"px";
        }catch(e){}
    }


}; //end
