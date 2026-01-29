let count2 = 0;
let subStep = 20;
let gravityAcceleration = {x: 0, y: 0.0981, z: 0};
let constraintRadius = 15;
let constraintCentre = {x: 0, y: 0, z: 0};
let subStepInterval = 1/subStep;

let file = document.getElementById("inputFile");
let forceInput = document.getElementById("forceInput");
let timeInput = document.getElementById("timeInput");
let table = document.getElementById("infoHolder");
let idInput = document.getElementById("idInput");

let moveTable = document.getElementById("moveInfo");
let moveList = []

let cueBall;
let frictionCoefficient = 0.05;
let num = 1;
let mnum = 1;
let initialVelocity;
let topDown = false;
let weirdThreshold = 0.99;

// Use this for initialization
function Start() {
  debugAxis = false;
  debugSkybox = false;
  /*fetch("https://data.aadideepchand1.repl.co", {mode: 'cors'})
    .then(response => {
      if (response.ok) return response.text();
      throw new Error('Network response was not ok.')
    })
    .then(function(data){
      parseObjData(data);
      cueBall = createSphere({x: 6, y: -4.7, z: 5}, {x: 200, y: 200, z:200} , 4.7, 0.095,"#001");
      addElement(cueBall);
      ball1 = createSphere({x: 10.7, y: -4.7, z: 13.141}, {x: 100, y: 200, z:200} , 4.7, 0.095,"#002")
      addElement(ball1);
      ball2 = createSphere({x: 1.3, y: -4.7, z: 13.141}, {x: 255, y: 100, z:200} , 4.7, 0.095,"#003")
      addElement(ball2);
      cueBall = getSphere(cueBall);
    });*/
}


//update
function Update() {
  //Camera controls
  if(getKeyDown("t")) {
    if(topDown) {
      camera.position = { x: 0, y: 75, z: -250 };
      camera.rotation = {x: 0, y:0, z:0};
      topDown = false;
    } else {
      camera.position = {x:0, y:0, z: -250};
      camera.rotation = {x: Math.PI/2, y:0, z:0};
      topDown = true;
    }
  }
  if(!topDown) {
    if(getKeyDown("q")) {
      camera.rotation.y -= 0.1;
    } else if(getKeyDown("e")) {
      camera.rotation.y += 0.1;
    } else if(getKeyDown("a")) {
      camera.position.x -= 0.5;
    } else if(getKeyDown("d")) {
      camera.position.x += 0.5;
    } else if(getKeyDown("w")) {
      camera.position.z += 0.5;
    } else if(getKeyDown("s")) {
      camera.position.z -= 0.5;
    } else if(getKeyDown(",")) {
      camera.position.y += 0.5;
    } else if(getKeyDown(".")) {
      camera.position.y -= 0.5;
    }
  } else {
    if(getKeyDown("a")) {
      camera.position.x -= 0.5;
    } else if(getKeyDown("d")) {
      camera.position.x += 0.5;
    } else if(getKeyDown(".")) {
      camera.position.z += 0.5;
    } else if(getKeyDown(",")) {
      camera.position.z -= 0.5;
    } else if(getKeyDown("w")) {
      camera.position.y += 0.5;
    } else if(getKeyDown("s")) {
      camera.position.y -= 0.5;
    }
  }
  //Anything else
  /*//Spam ball demo
  count2++
  if(count2 == 3 && objects.length < 1) {
    createSphere({ x: Math.random() * 10, y: 0, z: Math.random() * 10 }, {x: Math.random() * 255, y: Math.random() * 255, z: Math.random() * 255}, 2, 0.02);
    count2 = 0;
  }*/
  //Physics Substepping
  for(let a=0; a < subStep; a++) { 
    for(let i=0; i < objects.length; i++) {
      let currentObj = objects[i];
      //Apply gravity
      currentObj.acceleration = addVector(currentObj.acceleration,gravityAcceleration);
      //Apply constraint
      /*let diff = subtractVector(currentObj.position, constraintCentre)
      let constraintDist = magnitude(diff);
      if(constraintDist > constraintRadius-currentObj.radius) {
        let idealDist = constraintRadius-currentObj.radius;
        currentObj.position = scalarMultiplyVector(idealDist/constraintDist,currentObj.position);
      }*/
      //Collision physics
      let weird = false;
      for(let j=0; j < triangles.length; j++) {
        let point = checkTriangleIntersection(triangles[j][0],triangles[j][1],triangles[j][2],currentObj.position, currentObj.radius);
        if(point != false) {
          let normal = point[1];
          let collisionAxis = normalise(subtractVector(currentObj.position,point[0]));
          let idealPosition = addVector(point[0],scalarMultiplyVector(currentObj.radius,collisionAxis))
          currentObj.position = idealPosition;
          if(Math.abs(dotProductSum(normal,normalise(currentObj.velocity))) > weirdThreshold) {
            console.log("yh");
            weird = true;
            let velocity = scalarMultiplyVector(-1,currentObj.velocity);
            let frictionForce = frictionCoefficient * 0.0981 * currentObj.mass;
            if(magnitude(velocity) < 0.01) {
              if(magnitude(velocity) != 0) {
                velocity = scalarMultiplyVector((1-frictionForce/magnitude(velocity)*0.01),velocity);
              }
              if(magnitude(velocity) < 0.001) {
                velocity = emptyVector;
              }
            } else {
              velocity = scalarMultiplyVector((1-frictionForce),velocity); 
            }
            currentObj.velocity = velocity;
          } else {
            let velocity = subtractVector(currentObj.velocity,scalarMultiplyVector(2 * dotProductSum(currentObj.velocity,normal),normal));
            let frictionForce = frictionCoefficient * 0.0981 * currentObj.mass;
            if(magnitude(velocity) < 0.01) {
              if(magnitude(velocity) != 0) {
                velocity = scalarMultiplyVector((1-frictionForce/magnitude(velocity)*0.01),velocity);
              }
              if(magnitude(velocity) < 0.001) {
                velocity = emptyVector;
              }
            } else {
              velocity = scalarMultiplyVector((1-frictionForce),velocity); 
            }
            currentObj.previousPosition = subtractVector(currentObj.position,velocity);
          }
        }
      }
      for(let j=0; j < objects.length; j++) {
        if(i != j) {
          let collisionAxis = subtractVector(currentObj.position, objects[j].position);
					let collisionDist = magnitude(collisionAxis);
					if (collisionDist < currentObj.radius + objects[j].radius) {
						let obj_i = currentObj;
						let obj_j = objects[j];

						// Quadratic to calculate exact position at collision
						let a = (obj_i.velocity.x - obj_j.velocity.x) ** 2 + (obj_i.velocity.y - obj_j.velocity.y) ** 2 + (obj_i.velocity.z - obj_j.velocity.z) ** 2;
						let b = 2 * ((obj_i.position.x - obj_j.position.x) * (obj_i.velocity.x - obj_j.velocity.x) + (obj_i.position.y - obj_j.position.y) * (obj_i.velocity.y - obj_j.velocity.y) + (obj_i.position.z - obj_j.position.z) * (obj_i.velocity.z - obj_j.velocity.z));
						let c = (obj_i.position.x - obj_j.position.x) ** 2 + (obj_i.position.y - obj_j.position.y) ** 2 + (obj_i.position.z - obj_j.position.z) ** 2 - (obj_i.radius + obj_j.radius) ** 2;

						// Solving for collision time
						let t = (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);

						// Centers of mass at collision
						let center_i = addVector(obj_i.position, scalarMultiplyVector(t, obj_i.velocity));
						let center_j = addVector(obj_j.position, scalarMultiplyVector(t, obj_j.velocity));

						// Difference in centers and velocity
						let velocity_diff = subtractVector(obj_i.velocity, obj_j.velocity);
						let center_diff = subtractVector(center_i, center_j);

						let velocity_i = subtractVector(obj_i.velocity, scalarMultiplyVector((2 * obj_j.mass / (obj_i.mass + obj_j.mass)) * (dotProductSum(velocity_diff, center_diff) / (magnitude(center_diff) ** 2)), center_diff));
						let velocity_j = addVector(obj_j.velocity, scalarMultiplyVector((2 * obj_i.mass / (obj_i.mass + obj_j.mass)) * (dotProductSum(velocity_diff, center_diff) / (magnitude(center_diff) ** 2)), center_diff));

						obj_i.position = addVector(center_i, scalarMultiplyVector(1 - t, velocity_i));
						obj_j.position = addVector(center_j, scalarMultiplyVector(1 - t, velocity_j));

						obj_i.velocity = velocity_i
						obj_j.velocity = velocity_j
						weird = true
					}
        }
      }
      //VERLET INTEGRATION
      updateElement(currentObj.id);
      if(!weird) {
        currentObj.velocity = subtractVector(currentObj.position,currentObj.previousPosition);
      }
      currentObj.previousPosition = currentObj.position;
      currentObj.position = addVector(addVector(currentObj.position, currentObj.velocity),scalarMultiplyVector(subStepInterval**2,currentObj.acceleration));
      //currentObj.position = addVector(currentObj.position ,addVector(scalarMultiplyVector(subStep,currentObj.velocity),scalarMultiplyVector(((subStep**2)/2),currentObj.acceleration)));
      currentObj.acceleration = emptyVector;
      //Update rendering order
      let boundaryPosition = {x: -maxP*Math.cos(camera.rotation.y+(Math.PI/2)), y: camera.position.y ,z: -maxP*Math.sin(camera.rotation.y+(Math.PI/2))}
      currentObj.dValue = getDistance(currentObj.position,boundaryPosition);
    }
  }
  objects.sort(function(a,b){return a.dValue-b.dValue});
  objects.reverse();
}



//Input functions
function addElement(id) {
  let row = table.insertRow(table.rows.length-1);
  let t = getSphere(id);
  console.log(t);
  row.id = "element-" + id;
  row.insertCell(0).innerText = id;
  row.insertCell(1).innerText = "x: " + t.position.x + "\ny: " + t.position.y + "\nz: " + t.position.z;
  row.insertCell(2).innerText = "x: " + t.velocity.x + "\ny: " + t.velocity.y + "\nz: " + t.velocity.z;
  row.insertCell(3).innerText = "x: " + t.acceleration.x + "\ny: " + t.acceleration.y + "\nz: " + t.acceleration.z;
  row.insertCell(4).innerText = t.mass;
  row.insertCell(5).innerText = t.radius;
  row.insertCell(6).style = "background-color: rgb(" + t.colour.x + "," + t.colour.y + "," + t.colour.z + ")";
  let button = document.createElement("button");
  button.setAttribute("onclick", "removeElement('"+id+"')");
  button.id = "dButton";
  let image = document.createElement("img");
  image.src = "delete.png";
  button.appendChild(image);
  row.insertCell(7).appendChild(button);
}
function updateElement(id) {
  let t = getSphere(id);
  if(t != null) {
    let row = document.getElementById("element-" + id);
    row.cells[1].innerText = "x: " + Math.round(t.position.x * 1000)/1000 + "\ny: " + Math.round(t.position.y * 1000)/1000 + "\nz: " + Math.round(t.position.z * 1000)/1000;
    row.cells[2].innerText = "x: " + Math.round(t.velocity.x * 1000)/1000 + "\ny: " + Math.round(t.velocity.y * 1000)/1000 + "\nz: " + Math.round(t.velocity.z * 1000)/1000;
    row.cells[3].innerText = "x: " + Math.round(t.acceleration.x * 1000)/1000 + "\ny: " + Math.round(t.acceleration.y * 1000)/1000 + "\nz: " + Math.round(t.acceleration.z * 1000)/1000; 
  }
}
function addNewElement() {
  let row = document.getElementById("newInfo");
  let position = {x: Number(row.cells[1].children[0].value), y: Number(row.cells[1].children[1].value), z: Number(row.cells[1].children[2].value)}
  let radius = Number(row.cells[5].children[0].value);
  let mass = Number(row.cells[4].children[0].value);
  let colour = hexToRGB(row.cells[6].children[0].value)
  addElement(createSphere(position,colour,radius,mass,"#" + ('000' + num).slice(-3)));
  num++;
}
function removeElement(id) {
  document.getElementById("element-"+id).remove();
  let n = -1
  for(let i=0; i<objects.length; i++) {
    if(objects[i].id == id) {
      n = i;
      break;
    }
  }
  if(n > -1) {
    objects.splice(n,1);
  }
}




function addMoveElement(id){
  let row = moveTable.insertRow(moveTable.rows.length-1);
  let t = getMove(id);
  row.id = "moveElement-" + id;
  row.insertCell(0).innerText = ('000' + t.moveOrder).slice(-3);
  row.insertCell(1).innerText = t.ballID;
  row.insertCell(2).innerText = "x: " + t.direction.x + "\ny: " + t.direction.y + "\nz: " + t.direction.z;
  row.insertCell(3).innerText = t.time;
  row.insertCell(4).innerText = t.force;
  let button = document.createElement("button");
  button.setAttribute("onclick", "playMove('"+id+"')");
  button.id = "dButton";
  let image = document.createElement("img");
  image.src = "shoot.png";
  button.appendChild(image);
  row.insertCell(5).appendChild(button);
  button = document.createElement("button");
  button.setAttribute("onclick", "deleteMove('"+id+"')");
  button.id = "dButton";
  image = document.createElement("img");
  image.src = "delete.png";
  button.appendChild(image);
  row.insertCell(6).appendChild(button);
}
function addNewMoveElement() {
  let row = document.getElementById("newMoveInfo");
  let id = "#"+('000' + mnum).slice(-3);
  mnum++;
  let moveOrder = 0;
  let ballID = row.cells[1].children[0].value;
  let direction = {x: Number(row.cells[2].children[0].value), y: Number(row.cells[2].children[1].value), z: Number(row.cells[2].children[2].value)};
  let time = Number(row.cells[3].children[0].value);
  let force = Number(row.cells[4].children[0].value);
  moveList.push({id,ballID,direction,time,force,moveOrder});
  moveList[moveList.length-1].moveOrder = moveList.length;
  addMoveElement(id);
}
function playMove(id) {
  let t = getMove(id);
  let b = getSphere(t.ballID);
  let impulse = t.force * t.time;
  let velocityAmount = impulse / b.mass;
  let velocity = scalarMultiplyVector(velocityAmount,t.direction);
  intialVelocity = magnitude(velocity);
  b.previousPosition = subtractVector(b.position,addVector(b.velocity,velocity));
  b.velocity = subtractVector(b.position,b.previousPosition);
  b.previousPosition = b.position;
  b.position = addVector(addVector(b.position, b.velocity),scalarMultiplyVector(subStepInterval**2,b.acceleration));
  b.acceleration = emptyVector;
}
function updateMove(id) {
  let row = document.getElementById("moveElement-" + id);
  let t = getMove(id)
  row.cells[0].innerText = ('000' + t.moveOrder).slice(-3);
}
function deleteMove(id) {
  document.getElementById("moveElement-"+id).remove();
  let moveNum = getMove(id).moveOrder;
  moveList.splice(moveNum-1,1);
  for(let i=0; i<moveList.length; i++) {
    moveList[i].moveOrder = i+1;
    updateMove(moveList[i].id);
  }
}
function getMove(id) {
  for(let i=0; i<moveList.length; i++) {
    if(moveList[i].id == id) {
      return moveList[i];
    }
  }
  return null;
}






function hexToRGB(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    x: parseInt(result[1], 16),
    y: parseInt(result[2], 16),
    z: parseInt(result[3], 16)
  } : null;
}

file.onchange = function() {
  let reader = new FileReader();
  reader.readAsText(file.files[0]);
  reader.onload = function() {
    points = [];
    triangles = [];
    parseObjData(reader.result);
  }
}