import assert from 'node:assert/strict';

// A Canvas contract double, not a screenshot surrogate: it rejects malformed
// coordinates and leaked drawing state before a browser can silently ignore it.
export function canvasRecorder(){
  const calls=[],stack=[];
  let styles={globalAlpha:1,lineWidth:1,fillStyle:'#000',strokeStyle:'#000',lineCap:'butt',lineJoin:'miter',globalCompositeOperation:'source-over'};
  const check=value=>{
    if(typeof value==='number')assert(Number.isFinite(value),'Canvas geometry must be finite');
    else if(Array.isArray(value)||ArrayBuffer.isView(value))for(const item of value)check(item);
  };
  const record=(name,args)=>{for(const value of args)check(value);calls.push([name,...args]);};
  const target={
    save(){stack.push({...styles});record('save',[]);},
    restore(){assert(stack.length>0,'Canvas restore cannot underflow');styles=stack.pop();record('restore',[]);},
    measureText(text){return {width:String(text).length*6,actualBoundingBoxLeft:0,actualBoundingBoxRight:String(text).length*6,actualBoundingBoxAscent:10,actualBoundingBoxDescent:2};},
    getTransform(){return {a:1,b:0,c:0,d:1,e:0,f:0};},
    createLinearGradient(...args){record('createLinearGradient',args);return {addColorStop(position,color){assert(position>=0&&position<=1);record('addColorStop',[position,color]);}};},
    createRadialGradient(...args){assert(args[2]>=0&&args[5]>=0,'radial gradient radii cannot be negative');record('createRadialGradient',args);return {addColorStop(position,color){assert(position>=0&&position<=1);record('addColorStop',[position,color]);}};},
  };
  const methods=['beginPath','closePath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','rect','roundRect','fill','stroke','clip','fillRect','strokeRect','clearRect','translate','rotate','scale','transform','setTransform','resetTransform','setLineDash','fillText','strokeText','drawImage'];
  for(const name of methods)target[name]=(...args)=>record(name,args);
  target.arc=(...args)=>{assert(args[2]>=0,'arc radius cannot be negative');record('arc',args);};
  target.arcTo=(...args)=>{assert(args[4]>=0,'arc-to radius cannot be negative');record('arcTo',args);};
  target.ellipse=(...args)=>{assert(args[2]>=0&&args[3]>=0,'ellipse radii cannot be negative');record('ellipse',args);};
  const context=new Proxy(target,{
    get(object,key){if(key in object)return object[key];if(key in styles)return styles[key];throw Error('Canvas recorder lacks API '+String(key));},
    set(object,key,value){check(value);if(key==='globalAlpha')assert(value>=0&&value<=1,'Canvas opacity must remain in range');if(key==='lineWidth')assert(value>0,'Canvas line width must be positive');styles[key]=value;record('style:'+String(key),[typeof value==='object'?'gradient':value]);return true;},
  });
  return {
    context,calls,
    assertBalanced(){assert.equal(stack.length,0,'renderer must restore the Canvas save stack');assert.equal(styles.globalAlpha,1,'renderer must restore opacity');assert.equal(styles.globalCompositeOperation,'source-over','renderer must restore blend mode');},
    signature(){return JSON.stringify(calls);},
    painted(){return calls.filter(c=>['fill','stroke','fillRect','strokeRect'].includes(c[0])).length;},
  };
}
