const BACKEND_URL = "https://backspaceengineserver.fwh.is"
let display = document.getElementById("display");
let fpsCounter = document.getElementById("fpsCounter");
let ctx = display.getContext('2d');
let objects = [];
let triangles = [];
let points = [];
let camera = {
  position: { x: 0, y: 75, z: -250 },
  rotation: { x: 0, y: 0, z: 0 },
  normals: { x: { x: 1, y: 0, z: 0 }, y: { x: 0, y: 1, z: 0 }, z: { x: 0, y: 0, z: 1 } },
  fov: 60,
  near: 0.001,
  far: 1000
}
let resolutionX = 400;
let resolutionY = 400;
let aspectRatio = 1;
let emptyVector = {x: 0, y: 0, z: 0};
let fps = 0;
let key = "";
let pause = false;
let maxP = 0;
let currentFile = "";

function stopStart() {
  pause = !pause;
}

function normalise(vec1) {
  var normaliser = Math.sqrt((vec1.x ** 2) + (vec1.y ** 2) + (vec1.z ** 2));
  return { x: vec1.x / normaliser, y: vec1.y / normaliser, z: vec1.z / normaliser };
}
function scalarMultiplyVector(scalar, vec) {
  return { x: vec.x * scalar, y: vec.y * scalar, z: vec.z * scalar };
}
function scalarDivideVector(scalar, vec) {
  return { x: vec.x/scalar, y: vec.y/scalar, z: vec.z/scalar };
}
function addVector(vec1, vec2) {
  return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z }
}
function subtractVector(vec1, vec2) {
  return { x: vec1.x - vec2.x, y: vec1.y - vec2.y, z: vec1.z - vec2.z }
}
function crossProduct(vec1, vec2) {
  let outputVec = { x: 0, y: 0, z: 0 };
  outputVec.x = (vec1.y * vec2.z) - (vec1.z * vec2.y);
  outputVec.y = (vec1.z * vec2.x) - (vec1.x * vec2.z);
  outputVec.z = (vec1.x * vec2.y) - (vec1.y * vec2.x);
  return outputVec;
}
function dotProduct(vec1, vec2) {
  return {x: vec1.x * vec2.x, y: vec1.y * vec2.y, z: vec1.z * vec2.z};
}
function dotProductSum(vec1, vec2) {
  return (vec1.x * vec2.x) + (vec1.y * vec2.y) + (vec1.z * vec2.z)
}
function magnitude(vec) {
  return Math.sqrt((vec.x * vec.x) + (vec.y * vec.y) + (vec.z * vec.z));
}
function getDistance(vec1, vec2) {
  return magnitude(subtractVector(vec1, vec2));
}
function distanceBetweenPointAndLine(ray, point) {
  let pointDistance = subtractVector(ray.origin,point);
  let a = crossProduct(pointDistance, ray.direction);
  let distance = magnitude(a)/magnitude(ray.direction);
  return distance;
}

function createSphere(position = { x: 0, y: 0, z: 0 }, colour = { x: 0, y: 0, z: 0 }, radius = 1, mass = 1, id) {
  let velocity = emptyVector;
  let acceleration = emptyVector;
  let previousPosition = position;
  let initialPosition = position;
  let dValue = getDistance(position,camera.position);
  let sphere = { position, previousPosition, initialPosition, acceleration, velocity, mass, radius, colour, id, dValue};
  objects.push(sphere);
  return id;
}
function getSphere(id) {
  for(let i=0; i<objects.length; i++) {
    if(objects[i].id == id) {
      return objects[i];
    }
  }
  return null;
}
function createTriangle(p1, p2, p3, colour) {
  let triangle = [p1, p2, p3, colour];
  triangles.push(triangle);
  return triangles.length - 1; 
}

function multiplyMatrix(a, b) {
  if(a[0].length != b.length) {
    alert("Invalid matrix multiplication");
  }
  let result = Array(a.length).fill().map(() => Array(b[0].length));
  for (let i=0; i<a.length; i++) {
    for(let j=0; j<b[0].length; j++) {
      result[i][j] = 0;
      for(let k=0; k<b.length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}
function linePlaneIntersection(rayVector, rayPoint, planeNormal, planePoint) {
  let diff = subtractVector(rayPoint,planePoint);
  let prod1 = dotProduct(diff, planeNormal);
  let prod2 = dotProduct(rayVector, planeNormal);
  let prod3 = (prod1.x + prod1.y + prod1.z) / (prod2.x + prod2.y + prod2.z);
  return subtractVector(rayPoint, scalarMultiplyVector(prod3,rayVector));
}

function verifyPointInTriangle(p, p1, p2, p3) {
  let a = subtractVector(p1,p);
  let b = subtractVector(p2,p);
  let c = subtractVector(p3,p);
  let u = crossProduct(b,c);
  let v = crossProduct(c,a);
  let w = crossProduct(a,b);
  if(dotProductSum(u,v) < 0 || dotProductSum(u,w) < 0) {
    return false;
  }
  return true;
}

function checkTriangleIntersection(p1, p2, p3, center, radius) {
  let a = subtractVector(p2,p1);
  let b = subtractVector(p3,p1);
  let normal = normalise(crossProduct(a,b));
  let d = dotProductSum(normal,p1);
  //let t = (d - dotProductSum(normal,center)) / dotProductSum(normal,normal)
  //let point = addVector(center,scalarMultiplyVector(t,normal))
  let point = linePlaneIntersection(normal,center,normal,p1);
  if(getDistance(center,point) < radius) {
    if(verifyPointInTriangle(point,p1,p2,p3)) {
      let v = dotProductSum(normal,point);
      if(Math.abs(v-d) < 0.01) {
        return [point, normal];
      }  
    }
  }
  return false;
}

function reflectPointAcrossLine(p, d, o) {
  let c = (dotProductSum(p,d) - dotProductSum(o,d)) / dotProduct(d,d);
  let i = addVector(o,scalarMultiplyVector(c,d));
  return subtractVector(scalarMultiplyVector(2,i),p);
}

let perspectiveMatrix = [[1/(aspectRatio * Math.tan(camera.fov * 0.0025 * (Math.PI / 180))),0,0,0],[0,1/(Math.tan(camera.fov * 0.0025 * (Math.PI / 180))),0,0],[0,0,camera.far/(camera.far-camera.near),-(camera.far*camera.near)/(camera.far-camera.near)],[0,0,1,0]];

function renderScreen() {
  let cameraRotationMatrix = [[Math.cos(camera.rotation.y)*Math.cos(camera.rotation.z)+Math.sin(camera.rotation.y)*Math.sin(camera.rotation.x)*Math.sin(camera.rotation.z),Math.cos(camera.rotation.z)*Math.sin(camera.rotation.y)*Math.sin(camera.rotation.x),Math.cos(camera.rotation.x)*Math.sin(camera.rotation.y),0],
                              [Math.cos(camera.rotation.x)*Math.sin(camera.rotation.z),Math.cos(camera.rotation.x)*Math.cos(camera.rotation.z),-Math.sin(camera.rotation.x),0],
                              [Math.cos(camera.rotation.y)*Math.sin(camera.rotation.x)*Math.sin(camera.rotation.z)-Math.cos(camera.rotation.z)*Math.sin(camera.rotation.y),Math.cos(camera.rotation.y)*Math.cos(camera.rotation.z)*Math.sin(camera.rotation.x)+Math.sin(camera.rotation.y)*Math.sin(camera.rotation.z),Math.cos(camera.rotation.y)*Math.cos(camera.rotation.x),0],
                              [0,0,0,1]]
  let objectRotationMatrix = [[1,0,0,-camera.position.x],[0,1,-0,camera.position.y],[0,0,1,-camera.position.z],[0,0,0,1]];
  let tempTris = triangles;
  tempTris.sort(function(a,b) {
    return (a[0].z + a[1].z + a[2].z) > (b[0].z + b[1].z + b[2].z);
  })
  for(let i=0; i<tempTris.length; i++) {
    let thisTri = [];
    let normal = crossProduct(dotProduct(tempTris[i][0],tempTris[i][1]),dotProduct(tempTris[i][2],tempTris[i][1]));
    for(let j=0; j<3; j++) {
      let initialPoint = [[tempTris[i][j].x],[tempTris[i][j].y],[tempTris[i][j].z],[1]];
      let point = multiplyMatrix(perspectiveMatrix,multiplyMatrix(objectRotationMatrix,multiplyMatrix(cameraRotationMatrix,initialPoint)));
      thisTri.push(point);
    }
    ctx.beginPath();
    ctx.fillStyle = "rgb(" + tempTris[i][3].x + "," + tempTris[i][3].y + "," + triangles[i][3].z + ")";
    ctx.moveTo(thisTri[0][0][0]/thisTri[0][3][0] + resolutionX/2,thisTri[0][1][0]/thisTri[0][3][0] + resolutionY/2);
    ctx.lineTo(thisTri[1][0][0]/thisTri[1][3][0] + resolutionX/2,thisTri[1][1][0]/thisTri[1][3][0] + resolutionY/2);
    ctx.lineTo(thisTri[2][0][0]/thisTri[2][3][0] + resolutionX/2,thisTri[2][1][0]/thisTri[2][3][0] + resolutionY/2);
    ctx.closePath();
    ctx.stroke();
  }
  
  for(let i=0; i<objects.length; i++) {
    let initialPoint = [[objects[i].position.x],[objects[i].position.y],[objects[i].position.z],[1]];
    let point = multiplyMatrix(perspectiveMatrix,multiplyMatrix(objectRotationMatrix,multiplyMatrix(cameraRotationMatrix,initialPoint)));
    let p = scalarDivideVector(point[3][0],{x:point[0][0],y:point[1][0],z:point[2][0]});
    
    let normal = normalise(subtractVector(camera.position, objects[i].position));
    let d1 = {x: -normal.y, y:normal.x, z: 0};
    let d2 = crossProduct(normal,d1);

    let e1 = addVector(scalarMultiplyVector(objects[i].radius,normalise(d1)),objects[i].position);
    let e2 = addVector(scalarMultiplyVector(objects[i].radius,normalise(d2)),objects[i].position);

    let p1 = multiplyMatrix(perspectiveMatrix,multiplyMatrix(objectRotationMatrix,multiplyMatrix(cameraRotationMatrix,[[e1.x],[e1.y],[e1.z],[1]])));
    let p2 = multiplyMatrix(perspectiveMatrix,multiplyMatrix(objectRotationMatrix,multiplyMatrix(cameraRotationMatrix,[[e2.x],[e2.y],[e2.z],[1]])));
    
    let f1 = scalarDivideVector(p1[3][0],{x:p1[0][0],y:p1[1][0],z:p1[2][0]});
    let f2 = scalarDivideVector(p2[3][0],{x:p2[0][0],y:p2[1][0],z:p2[2][0]});

    let radius = Math.max(pt(f1,p),pt(f2,p));
    
    //let perpNormal = normalise({x: 1, y: 1, z: -(normal.x + normal.y)/normal.z});
    //let initialEdgePoint = [[objects[i].position.x + (objects[i].radius * perpNormal.x)],[objects[i].position.y + (objects[i].radius * perpNormal.y)],[objects[i].position.z + (objects[i].radius * perpNormal.z)],[1]];
    //let edgePoint = multiplyMatrix(perspectiveMatrix,multiplyMatrix(cameraRotationMatrix,initialEdgePoint));
    //let radius = Math.max(Math.abs((point[0][0]/point[3][0]) - (edgePoint[0][0]/edgePoint[3][0])), Math.abs((point[1][0]/point[3][0]) - (edgePoint[1][0]/edgePoint[3][0])))   
    
    ctx.fillStyle = "rgb(" + objects[i].colour.x + "," + objects[i].colour.y + "," + objects[i].colour.z + ")";
    ctx.beginPath()
    ctx.arc((point[0][0]/point[3][0]) + resolutionX/2, (point[1][0]/point[3][0]) + resolutionY/2, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  //Debugging
  /*let bp = {x: -maxP*Math.cos(camera.rotation.y+(Math.PI/2))*0.5 ,y: camera.position.y ,z: -maxP*Math.sin(camera.rotation.y+(Math.PI/2))*0.5}
  let h = multiplyMatrix(perspectiveMatrix,multiplyMatrix(objectRotationMatrix,multiplyMatrix(cameraRotationMatrix,[[bp.x],[bp.y],[bp.z],[1]])));
  ctx.beginPath()
  ctx.arc((h[0][0]/h[3][0]) + resolutionX/2, (h[1][0]/h[3][0]) + resolutionY/2, 7, 0, 2 * Math.PI);
  ctx.fill();*/

}

function sort(a) {
  let arr = [a[0]]
  for(let i=1; i < a.length; i++) {
    let insert = false;
    for(let j=0; j<arr.length; j++) {
      if(a[i].dValue < arr[j].dValue) {
        arr.splice(j,0,a[i]);
        insert = true;
        break;
      }
    }
    if(!insert) {
      arr.push(a[i])
    }
  }
  return arr;
}

function pt(a,b) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
}

const waitForScriptToLoad = (scriptName, checkTimeMs, timeOutMs) => {
  let elapsedTime = 0;
  return new Promise((resolve, reject) => {
    setTimeout(x => reject('script: ' + scriptName + ' Timed out!')
      , timeOutMs)
    const time = setInterval(() => {
      elapsedTime += checkTimeMs;
      if (document.body.innerHTML.indexOf(scriptName) > -1) {
        resolve(
          {
            response: 'script: ' + scriptName + ' found!',
            time: (elapsedTime / 1000).toFixed(2) + 's'
          });
        clearInterval(time);
      }
    }, checkTimeMs)
  })
}

function getKeyDown(str) {
  return key.includes(str);
}

waitForScriptToLoad('script.js', 100, 20000)
  .then(res => {
    Start();
    let updateInterval = setInterval(refresh,25);
    let fpsInterval = setInterval(() => {fpsCounter.innerText = "FPS: " + fps; fps = 0;}, 1000);
    addEventListener('keydown', function(event) {
      if(!key.includes(event.key)) {
        key += event.key;
      }
    });
    addEventListener('keyup', function(event) {
      key = key.replace(event.key,"");
    });
  })
  .catch(err => console.log(err))

function refresh() {
  if(!pause) {
    ctx.clearRect(0, 0, display.width, display.height);
    Update();
    renderScreen();
    fps++;
  }
}

function manualUpdate() {
  ctx.clearRect(0, 0, display.width, display.height);
  Update();
  renderScreen();
  fps++;
}

function parseObjData(a) {
  currentFile = a;
  //str = str.slice(str.indexOf("<br>o"));
  let str = a.replaceAll("%20","");
  str = a.replaceAll("<br>","");
  str = str.split("\n");
  for(let i = 0; i<str.length; i++) {
    if(str[i][0] == "v" && str[i][1] == " ") {
      let a = str[i].slice(2).replace("\n","").split(" ");
      let point = {x: Number(a[0]), y: Number(a[1]), z: Number(a[2])}
      let d = getDistance(point,emptyVector);
      if (d > maxP) {maxP = d;}
      points.push(point);
    }
    if(str[i][0] == "f" && str[i][1] == " ") {
      let a = str[i].slice(2).replace("\n","").split(" ");
      createTriangle(points[Number(a[0])-1],points[Number(a[1])-1],points[Number(a[2])-1],emptyVector);
    }
    if(str[i][0] == "b" && str[i][1] == " ") {
      let a = str[i].slice(2).replace("\n","").split(" ");
      console.log(a);
      let id = a[0]
      if(!getSphere(id)) {
        let position = {x: Number(a[1]), y: Number(a[2]), z: Number(a[3])}
        let mass = Number(a[4]);
        let radius = Number(a[5]);
        let colour = {x: Number(a[6]), y: Number(a[7]), z: Number(a[8])}
        createSphere(position,colour,radius,mass,id);
        addElement(id);
        num = Number(id.slice(1)) + 1; 
      }
    }
    if(str[i][0] == "m" && str[i][1] == " ") {
      let a = str[i].slice(2).replace("\n","").split(" ");
      let id = a[0];
      if(!getMove(id)) {
        let ballID = a[1];
        let direction = {x: Number(a[2]), y: Number(a[3]), z: Number(a[4])}
        let time = Number(a[5]);
        let force = Number(a[6]);
        let moveOrder = Number(a[7]);
        moveList.push({id,ballID,direction,time,force,moveOrder});
        addMoveElement(id);
        mnum = Number(id.slice(1)) + 1;
      }
    }
  }
  ctx.clearRect(0, 0, display.width, display.height);
  renderScreen();
}

function exportData(sceneName) {
  for(let i=0; i<objects.length; i++) {
    currentFile += "\nb " + objects[i].id + " " + objects[i].initialPosition.x + " " + objects[i].initialPosition.y + " " + objects[i].initialPosition.z + " " + objects[i].mass + " " + objects[i].radius + " " + objects[i].colour.x + " " + objects[i].colour.y + " " + objects[i].colour.z;
  }
  for(let i=0; i<moveList.length; i++) {
    currentFile += "\nm " + moveList[i].id + " " + moveList[i].ballID + " " + moveList[i].direction.x + " " + moveList[i].direction.y + " " + moveList[i].direction.z + " " + moveList[i].time + " " + moveList[i].force + " " + moveList[i].moveOrder;
  }
  let encodedData = btoa(currentFile);
  let dataArr = encodedData.match(/.{1,2080}/g);
  sendData(dataArr,0,sceneName)
}

function fetchData(sceneName) {
  fetch("https://ac3f8a8e-1d1e-4821-a40c-bbd6f1f20783-00-3q4wiabw8fpnv.janeway.replit.dev?func=0&scene="+sceneName, {mode: 'cors'}) 
    .then(response => {
      if (response.ok) return response.text();
      throw new Error('Network response was not ok.')
    })
    .then(function(a) {
      if(a.includes("No such file or directory")) {
        alert("File doesn't exist");
      } else {
        parseObjData(atob(a));
        alert("Finished loading: " + sceneName);
      }
    }); 
}

function loadScene() {
  let input = document.getElementById("loadInput").value;
  document.getElementById("loadInput").value = "Loading..."
  clearScene();
  
  for(let i=0; i<objects.length; i++) {
    document.getElementById("element-"+objects[i].id).remove();
  }
  for(let i=0; i<moveList.length; i++) {
    document.getElementById("moveElement-"+moveList[i].id).remove();
  }
  objects = [];
  moveList = [];
  
  fetchData(input);
  document.getElementById("loadInput").value = "";
}
function saveScene() {
  let input = document.getElementById("saveInput").value;
  document.getElementById("saveInput").value = "Loading...";
  exportData(input);
}
function deleteScene() {
  let input = document.getElementById("deleteInput").value;
  fetch(BACKEND_URL+"?func=2&scene="+input, {mode: 'cors'}) 
    .then(response => {
      if (response.ok) return response.text();
      throw new Error('Network response was not ok.')
    })
    .then(function(a) {
      if(a == "complete") {
        alert("Successfully deleted: " + input);
      } else {
        alert(a);
      }
    }); 
}
function clearScene() {
  triangles = [];
  points = [];
  key = "";
  maxP = 0;
  currentFile = "";
  ctx.clearRect(0, 0, display.width, display.height);
  renderScreen();
}

function sendData(data, index, sceneName) {
  if(index < data.length-1) {
    fetch(BACKEND_URL+"?func=1&scene="+sceneName+"&data="+data[index], {mode: 'cors'}) 
      .then(response => {
        if (response.ok) return response.text();
        throw new Error('Network response was not ok.')
      })
      .then(function(a) {
        document.getElementById("saveInput").value = "Loading... (" + (index+1) + "/" + data.length + ")";
        sendData(data, index+1, sceneName);
      }); 
  } else {
    fetch(BACKEND_URL+"?func=1&scene="+sceneName+"&data="+data[index], {mode: 'cors'}) 
      .then(response => {
        if (response.ok) return response.text();
        throw new Error('Network response was not ok.')
      })
      .then(function(a){
        document.getElementById("saveInput").value = "";
        alert("Successfully saved as: " + sceneName);
      });
  }
}

function getAllScenes() {
  fetch(BACKEND_URL+"?func=3", {mode: 'cors'}) 
    .then(response => {
      if (response.ok) return response.text();
      throw new Error('Network response was not ok.')
    })
    .then(function(a) {
      console.log(a);
    }); 
}

function pauseSim() {
  pause = !pause;
  pauseButton = document.getElementById("pauseButton");
  if(pause == true) {
    pauseButton.innerText = "Resume Simulation"
  } else {
    pauseButton.innerText = "Pause Simulation"
  }
}