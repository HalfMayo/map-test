import * as THREE from "three";
import GUI from 'lil-gui';
import {CSS2DObject, CSS2DRenderer, GLTFLoader, OrbitControls} from "three/addons";
import {starter, otherActor, resetDialogueStep, goNextDialogue, setStarter} from "./dialogue.js";
import {npcs, places} from "./npcsPlaces.js";
import {tagName, tagDescription, npcName, placeName} from "./variables.js";

// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

const pressTip = document.getElementById('press-tip');

// Scene
const scene = new THREE.Scene();

// Camera
const sizes = { width: window.innerWidth, height: window.innerHeight };
const aspectRatio = sizes.width / sizes.height;
const d = 10;
const camera = new THREE.OrthographicCamera(-d * aspectRatio, d * aspectRatio, d, -d, 0.1,500);
camera.position.set(50, 50, 50);
camera.lookAt(scene.position);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const cssRenderer = new CSS2DRenderer();
cssRenderer.setSize(sizes.width, sizes.height);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
document.body.appendChild( cssRenderer.domElement );

// Helpers
const grid = new THREE.GridHelper(100, 100);
const axesHelper = new THREE.AxesHelper();
scene.add(grid, axesHelper);

// Loaders
const gltfLoader = new GLTFLoader();

// Variables
let person, lastKnowPosition;
const meshes = [];
let startingRotation, rotationFactor, turn, distance;
let animationMixer, animations, startAction;
let keyDownMovement, keyUpMovement;
let rotationFraction = 15;
const actions = {
    idle: {weight: 0},
    walk: {weight: 0},
};
const keyMap = [];
const pressCheck = {repeat: false, lastRepeat: 0};
let positionStart = 1;
const clock = new THREE.Clock();
let previousTime = 0;
let lastSecond = 0;
let startDelay = 0;
const delay = 0.2;
let showDialogue = false;

// Objects and Lights
// Geometries and Materials
const houseGeometry = new THREE.BoxGeometry(10, 4, 3);
const houseMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.4,
    metalness: 0.8
});
const personMainMaterial = new THREE.MeshBasicMaterial({color: 'lightblue'});
const personSecMaterial = new THREE.MeshBasicMaterial({color: 'darkorange'});

// Models
gltfLoader.load('/models/person.glb',
    (gltf) => {
        person = gltf.scene.children[0];
        person.children[0].material = personSecMaterial;
        person.children[1].material = personMainMaterial;

        person.rotation.z = -Math.PI / 4;
        startingRotation = person.rotation.z;
        animationMixer = new THREE.AnimationMixer(person);
        animations = gltf.animations;
        actions.idle.action = animationMixer.clipAction(animations[0]);
        actions.walk.action = animationMixer.clipAction(animations[2]);
        startAction = 'idle';
        setWeight(actions.idle.action,1);
        actions.idle.action.play();
        scene.add(person);
        lastKnowPosition = new THREE.Vector3(0, 0, 0);
    },
    (progress) => console.log(progress),
    (error) => console.log(error)
)

//Meshes
const floor = new THREE.Mesh(new THREE.PlaneGeometry(50,50), houseMaterial);
floor.rotation.x = -Math.PI / 2;
const house1 = new THREE.Mesh(houseGeometry, houseMaterial);
house1.name = "PLACE|Fisherman's house";
house1.position.set(-7, 2, 7);
house1.rotation.y = Math.PI/4.5;
const boxH1 = new THREE.Box3().setFromObject(house1);
const lowH1 = boxH1.min;
const highH1 = boxH1.max;
const house1Vertices = [
    new THREE.Vector3(lowH1.x, lowH1.y, lowH1.z),
    new THREE.Vector3(highH1.x, lowH1.y, lowH1.z),
    new THREE.Vector3(lowH1.x, lowH1.y, highH1.z),
    new THREE.Vector3(highH1.x, lowH1.y, highH1.z)
];
house1.vertices = house1Vertices;

const house2 = new THREE.Mesh(houseGeometry, houseMaterial);
house2.name = "PLACE|Chef's house";
house2.position.set(7, 2, -7);
house2.rotation.y = Math.PI/4.5;
const boxH2 = new THREE.Box3().setFromObject(house2);
const lowH2 = boxH2.min;
const highH2 = boxH2.max;

const house2Vertices = [
    new THREE.Vector3(lowH2.x, lowH2.y, lowH2.z),
    new THREE.Vector3(highH2.x, lowH2.y, lowH2.z),
    new THREE.Vector3(lowH2.x, lowH2.y, highH2.z),
    new THREE.Vector3(highH2.x, lowH2.y, highH2.z)
];
house2.vertices = house2Vertices;

const fisherman = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1.7, 16),
    personSecMaterial
);
fisherman.name = 'NPC|John Doe';
fisherman.position.set(-2, 0.85, 7);
fisherman.normPosition = new THREE.Vector3(-2, 0, 7);

const tagDiv = document.querySelector('div.ui');
const tagLabel = new CSS2DObject(tagDiv);
tagLabel.center.set(0.5, 2);
tagLabel.visible = false;

meshes.push(house1, house2,fisherman);
scene.add(house1, house2, fisherman, floor);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(1, 0.25, 0)
scene.add(directionalLight);

// Functions and events
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.left = -d * camera.aspect;
    camera.right = d * camera.aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    cssRenderer.setSize(sizes.width, sizes.height);
});

window.addEventListener('keydown', (e) => {
    if((e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD') && !showDialogue) {
        if(keyDownMovement !== e.code){
            keyDownMovement = e.code;
        }
        pressCheck.repeat = e.repeat;
        pressCheck.lastRepeat = clock.getElapsedTime();
    } else {
        if(e.code === 'KeyE' && tagLabel.visible) {
            starter.style.display = 'flex';
            showDialogue = true;
            pressTip.style.display = 'none';
            tagLabel.visible = false;
        }
        if(e.code === 'Escape' && showDialogue) {
            resetDialogueStep();
            starter.style.display = 'none';
            if(otherActor) otherActor.style.display = 'none';
            showDialogue = false;
            pressTip.style.display = 'block';
            tagLabel.visible = true;
        }
        if((e.code === 'ArrowRight' || e.code === 'ArrowLeft') && showDialogue) {
            goNextDialogue(e.code)
        }
    }

    // if((e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD') && startAction === 'idle') {
    //     setWeight(actions.walk.action, 1);
    //     actions.walk.action.time = 1;
    //     actions.idle.action.crossFadeTo(actions.walk.action, 0.35, true);
    //     actions.walk.action.play();
    //     startAction = 'walk';
    // }
    //
    // if((e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD') && !keyMap.includes(e.code)) {
    //     if(keyMap.length < 2) {
    //         keyMap.push(e.code);
    //         if(e.code === 'KeyW' && keyMap.includes('KeyS')) {
    //             keyMap.splice(keyMap.indexOf('KeyS'), 1);
    //         }
    //         if(e.code === 'KeyS' && keyMap.includes('KeyW')) {
    //             keyMap.splice(keyMap.indexOf('KeyW'), 1);
    //         }
    //         if(e.code === 'KeyA' && keyMap.includes('KeyD')) {
    //             keyMap.splice(keyMap.indexOf('KeyD'), 1);
    //         }
    //         if(e.code === 'KeyD' && keyMap.includes('KeyA')) {
    //             keyMap.splice(keyMap.indexOf('KeyA'), 1);
    //         }
    //     }
    // }
    //
    // if(keyMap.includes('KeyW') && keyMap.includes('KeyD')) {
    //     if(positionDirection(positionStart, 4) !== 0 && rotationFraction === 15) {
    //         turn = 4;
    //         rotationFactor = calcRotationFactor(positionStart, turn);
    //         positionStart = 4;
    //     }
    //     person.position.z += -distance;
    // } else if(keyMap.includes('KeyW') && keyMap.includes('KeyA')) {
    //     if(positionDirection(positionStart, 6) !== 0 && rotationFraction === 15) {
    //         turn = 6;
    //         rotationFactor = calcRotationFactor(positionStart, turn);
    //         positionStart = 6;
    //     }
    //     person.position.x += -distance;
    // } else if(keyMap.includes('KeyS') && keyMap.includes('KeyD')) {
    //     if(positionDirection(positionStart, 2) !== 0 && rotationFraction === 15) {
    //         turn = 2;
    //         rotationFactor = calcRotationFactor(positionStart, turn);
    //         positionStart = 2;
    //     }
    //     person.position.x += distance;
    // } else if(keyMap.includes('KeyS') && keyMap.includes('KeyA')) {
    //     if(positionDirection(positionStart, 8) !== 0 && rotationFraction === 15) {
    //         if(positionStart === 1) {
    //             turn = 8;
    //             rotationFactor = (-Math.PI / 4) * -1;
    //         } else {
    //             turn = 8;
    //             rotationFactor = calcRotationFactor(positionStart, turn);
    //         }
    //         positionStart = 8;
    //     }
    //     person.position.z += distance;
    // } else if(keyMap.includes('KeyS')) {
    //     if(positionDirection(positionStart, 1) !== 0 && rotationFraction === 15) {
    //         if(positionStart === 7 || positionStart === 8) {
    //             turn = 9;
    //         } else {
    //             turn = 1;
    //         }
    //         rotationFactor = calcRotationFactor(positionStart, turn);
    //         positionStart = 1;
    //     }
    //     person.position.x += distance;
    //     person.position.z += distance;
    // } else if(keyMap.includes('KeyW')) {
    //     if(positionDirection(positionStart, 5) !== 0 && rotationFraction === 15) {
    //         turn = 5;
    //         rotationFactor = calcRotationFactor(positionStart, turn);
    //         positionStart = 5;
    //     }
    //     person.position.x += -distance;
    //     person.position.z += -distance;
    // } else if(keyMap.includes('KeyA')) {
    //     if(positionDirection(positionStart, 7) !== 0 && rotationFraction === 15) {
    //         if(positionStart === 1) {
    //             turn = -1;
    //         } else {
    //             turn = 7;
    //         }
    //         rotationFactor = calcRotationFactor(positionStart, turn);
    //         positionStart = 7;
    //     }
    //     person.position.x += -distance;
    //     person.position.z += distance;
    // } else if(keyMap.includes('KeyD')) {
    //     if(positionDirection(positionStart, 3) !== 0 && rotationFraction === 15) {
    //         turn = 3;
    //         rotationFactor = calcRotationFactor(positionStart, turn);
    //         positionStart = 3;
    //     }
    //     person.position.x += distance;
    //     person.position.z += -distance;
    // }
    //
    // camera.position.x = person.position.x + 50;
    // camera.position.z = person.position.z + 50;
})

window.addEventListener('keyup', (e) => {
    if(!showDialogue) {
        keyUpMovement = e.code;
    }
    // if((e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD')) {
    //     keyMap.splice(keyMap.indexOf(e.code), 1);
    //     if(keyMap.length === 0) {
    //         setWeight(actions.idle.action, 1);
    //         actions.idle.action.time = 1;
    //         actions.walk.action.crossFadeTo(actions.idle.action, 0.35, true);
    //         startAction = 'idle';
    //     }
    // }
})

function tick() {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // Direction management (keypress based direction, including direction change)
    if(person) {
        if((person.position.x !== lastKnowPosition.x || person.position.y !== lastKnowPosition.y || person.position.z !== lastKnowPosition.z) && elapsedTime >= lastSecond + 1) {
            for(const mesh of meshes) {
                calcDistances(mesh);
            }
            let nearestMesh = {distance: 4};
            for(const mesh of meshes) {
                if(mesh.distance < nearestMesh.distance) {
                    nearestMesh.mesh = mesh;
                    nearestMesh.distance = mesh.distance;
                }
            }
            //console.log('Nearest Mesh: ', nearestMesh);
            if(nearestMesh.mesh && !showDialogue) {
                setTag(nearestMesh.mesh);
                nearestMesh.mesh.add(tagLabel);
                tagLabel.visible = true;
                pressTip.style.display = 'block';
            } else if(!nearestMesh.mesh) {
                tagLabel.visible = false;
                pressTip.style.display = 'none';
            }

            lastKnowPosition = person.position.clone();
        }

        // KeyUp
        if((keyUpMovement === 'KeyW' || keyUpMovement === 'KeyS' || keyUpMovement === 'KeyA' || keyUpMovement === 'KeyD')) {
            keyMap.splice(keyMap.indexOf(keyUpMovement), 1);
            if(keyUpMovement === keyDownMovement) {
                keyDownMovement = null;
            }
            keyUpMovement = null;
            if(keyMap.length === 0 || (keyMap.length > 0 && !keyDownMovement)) {
                keyDownMovement = null;
                keyMap.length = 0;
                setWeight(actions.idle.action, 1);
                actions.idle.action.time = 1;
                actions.walk.action.crossFadeTo(actions.idle.action, 0.35, true);
                startAction = 'idle';
            }
        }

        if(keyMap.length === 0) {
            distance = 0;
        } else if (rotationFraction !== 15) {
            distance = 0.015;
        } else {
            distance = 0.025;
        }

        // Avoid continuous movement when no key is pressed
        if((keyDownMovement === 'KeyW' || keyDownMovement === 'KeyS' || keyDownMovement === 'KeyA' || keyDownMovement === 'KeyD')  && (pressCheck.repeat && elapsedTime - pressCheck.lastRepeat > 0.4)) {
            keyDownMovement = null;
            keyMap.length = 0;
            setWeight(actions.idle.action, 1);
            actions.idle.action.time = 1;
            actions.walk.action.crossFadeTo(actions.idle.action, 0.35, true);
            startAction = 'idle';
        }

            // KeyDown and movement
        if((keyDownMovement === 'KeyW' || keyDownMovement === 'KeyS' || keyDownMovement === 'KeyA' || keyDownMovement === 'KeyD') && startAction === 'idle') {
            setWeight(actions.walk.action, 1);
            actions.walk.action.time = 1;
            actions.idle.action.crossFadeTo(actions.walk.action, 0.35, true);
            actions.walk.action.play();
            startAction = 'walk';
            startDelay = elapsedTime;
        }

        // Avoid opposite keystrokes to be pressed at the same time
        if((keyDownMovement === 'KeyW' || keyDownMovement === 'KeyS' || keyDownMovement === 'KeyA' || keyDownMovement === 'KeyD') && !keyMap.includes(keyDownMovement)) {
            if(keyMap.length < 2) {
                keyMap.push(keyDownMovement);
                if(keyDownMovement === 'KeyW' && keyMap.includes('KeyS')) {
                    keyMap.splice(keyMap.indexOf('KeyS'), 1);
                }
                if(keyDownMovement === 'KeyS' && keyMap.includes('KeyW')) {
                    keyMap.splice(keyMap.indexOf('KeyW'), 1);
                }
                if(keyDownMovement === 'KeyA' && keyMap.includes('KeyD')) {
                    keyMap.splice(keyMap.indexOf('KeyD'), 1);
                }
                if(keyDownMovement === 'KeyD' && keyMap.includes('KeyA')) {
                    keyMap.splice(keyMap.indexOf('KeyA'), 1);
                }
            }
        }

        if(keyMap.includes('KeyW') && keyMap.includes('KeyD')) {
            if(positionDirection(positionStart, 4) !== 0 && rotationFraction === 15) {
                turn = 4;
                rotationFactor = calcRotationFactor(positionStart, turn);
                positionStart = 4;
            }

            if(elapsedTime - startDelay > delay) {
                person.position.z += -distance;
            }
        } else if(keyMap.includes('KeyW') && keyMap.includes('KeyA')) {
            if(positionDirection(positionStart, 6) !== 0 && rotationFraction === 15) {
                turn = 6;
                rotationFactor = calcRotationFactor(positionStart, turn);
                positionStart = 6;
            }

            if(elapsedTime - startDelay > delay) {
                person.position.x += -distance;
            }
        } else if(keyMap.includes('KeyS') && keyMap.includes('KeyD')) {
            if(positionDirection(positionStart, 2) !== 0 && rotationFraction === 15) {
                turn = 2;
                rotationFactor = calcRotationFactor(positionStart, turn);
                positionStart = 2;
            }
            if(elapsedTime - startDelay > delay) {
                person.position.x += distance;
            }
        } else if(keyMap.includes('KeyS') && keyMap.includes('KeyA')) {
            if(positionDirection(positionStart, 8) !== 0 && rotationFraction === 15) {
                if(positionStart === 1) {
                    turn = 8;
                    rotationFactor = (-Math.PI / 4) * -1;
                } else {
                    turn = 8;
                    rotationFactor = calcRotationFactor(positionStart, turn);
                }
                positionStart = 8;
            }

            if(elapsedTime - startDelay > delay) {
                person.position.z += distance;
            }
        } else if(keyMap.includes('KeyS')) {
            if(positionDirection(positionStart, 1) !== 0 && rotationFraction === 15) {
                if(positionStart === 7 || positionStart === 8) {
                    turn = 9;
                } else {
                    turn = 1;
                }
                rotationFactor = calcRotationFactor(positionStart, turn);
                positionStart = 1;
            }
            if(elapsedTime - startDelay > delay) {
                person.position.x += distance;
                person.position.z += distance;
            }
        } else if(keyMap.includes('KeyW')) {
            if(positionDirection(positionStart, 5) !== 0 && rotationFraction === 15) {
                turn = 5;
                rotationFactor = calcRotationFactor(positionStart, turn);
                positionStart = 5;
            }
            if(elapsedTime - startDelay > delay) {
                person.position.x += -distance;
                person.position.z += -distance;
            }
        } else if(keyMap.includes('KeyA')) {
            if(positionDirection(positionStart, 7) !== 0 && rotationFraction === 15) {
                if(positionStart === 1) {
                    turn = -1;
                } else {
                    turn = 7;
                }
                rotationFactor = calcRotationFactor(positionStart, turn);
                positionStart = 7;
            }
            if(elapsedTime - startDelay > delay) {
                person.position.x += -distance;
                person.position.z += distance;
            }
        } else if(keyMap.includes('KeyD')) {
            if(positionDirection(positionStart, 3) !== 0 && rotationFraction === 15) {
                turn = 3;
                rotationFactor = calcRotationFactor(positionStart, turn);
                positionStart = 3;
            }
            if(elapsedTime - startDelay > delay) {
                person.position.x += distance;
                person.position.z += -distance;
            }
        }

        if(elapsedTime - startDelay > delay) {
            camera.position.x = person.position.x + 50;
            camera.position.z = person.position.z + 50;
        }

        cylinderBody.position.copy(person.position);
    }

    // Rotation management upon direction change
    if(person && turn) {
        const actualRotation = person.rotation.z;
        const endRotation = startingRotation + rotationFactor;
        // console.log('keyMap: ', keyMap);
        // console.log(actualRotation, endRotation);
        // console.log('factor: ', rotationFactor, 'fraction: ', rotationFraction);
        if ((rotationFactor < 0) && (actualRotation > endRotation)) {
            person.rotation.z += rotationFactor / 15;
            rotationFraction --;
        } else if ((rotationFactor > 0) && (actualRotation < endRotation)) {
            person.rotation.z += rotationFactor / 15;
            rotationFraction --;
        } else {
            startingRotation = actualRotation;
            switch(turn) {
                case 1:
                    person.rotation.z = -Math.PI / 4;
                    break;
                case -1:
                    person.rotation.z = Math.PI / 4;
                    break;
                case 2:
                    person.rotation.z = -Math.PI / 2;
                    break;
                case 3:
                    person.rotation.z = -3 * Math.PI / 4;
                    break;
                case 4:
                    person.rotation.z = Math.PI;
                    break;
                case 5:
                    person.rotation.z = 3 * Math.PI / 4;
                    break;
                case 6:
                    person.rotation.z = Math.PI / 2;
                    break;
                case 7:
                    person.rotation.z = Math.PI / 4;
                    break;
                case 8:
                    person.rotation.z = 0;
                    break;
                case 9:
                    person.rotation.z = -Math.PI / 4;
                    break;
            }
            startingRotation = person.rotation.z;
            turn = false;
            rotationFraction = 15;
        }
    }

    // Update animation mixer
    if(animationMixer) {
        animationMixer.update(deltaTime);
    }

    if(elapsedTime >= lastSecond + 1) lastSecond = elapsedTime;

    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}

function setWeight(action, weight) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
    // console.log(action);
}

function positionDirection(pS, pE) {
    return pE - pS;
}

function calcRotationFactor(positionStart, positionEnd) {
    console.log('turn factor: ', positionDirection(positionStart, positionEnd))
    return (-Math.PI / 4) * positionDirection(positionStart, positionEnd);
}

function setTag(mesh) {
    const type = mesh.name.split('|')[0];
    const elementName = mesh.name.split('|')[1];
    if(type === 'NPC') {
        const npc = npcs.filter(el => el.name === elementName);
        tagName.textContent = npc[0].name;
        tagDescription.textContent = npc[0].description;
        npcName.textContent = npc[0].name + ', ' + npc[0].description;
    } else {
        const place = places.filter(el => el.name === elementName);
        tagName.textContent = place[0].name;
        tagDescription.textContent = '';
        placeName.textContent = place[0].name;
    }
    setStarter(elementName, type);
}

function calcDistances(mesh) {
    if(mesh.vertices) {
        const distances = [];
        for(const vertex of mesh.vertices) {
            distances.push(vertex.distanceTo(person.position));
        }
        mesh.distance = Math.min(...distances);
    } else {
        mesh.distance = mesh.normPosition.distanceTo(person.position);
    }
    // console.log(mesh.name, mesh.distance);
}

// Animate
tick();