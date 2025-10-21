import * as THREE from "three";
import GUI from 'lil-gui';
import {GLTFLoader, OBB} from "three/addons";
import {starter, otherActor, resetDialogueStep, goNextDialogue, setStarter} from "./dialogue.js";
import {npcs} from "./npcs.js";
import {places} from "./places.js";
import {tagName, tagDescription, npcName, placeName, direction, pressTip} from "./variables.js";
import {Assets, Sprite, Container, Graphics, WebGLRenderer, BitmapText} from 'pixi.js';
import '@pixi/layout';
import {LayoutContainer} from "@pixi/layout/components";

// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

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
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    stencil: true,
    alpha: true,
    canvas: canvas,
    context: canvas.getContext('webgl2'),
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;

// Helpers
const grid = new THREE.GridHelper(100, 100);
const axesHelper = new THREE.AxesHelper();
scene.add(grid, axesHelper);

// Loaders
const gltfLoader = new GLTFLoader();

// Variables
let person, floorHoles, lastKnownPosition, personBB, personRaycaster, raycasterHelper;
let background, foreground;
let startingRotation, rotationFactor, turn, distance;
let animationMixer, oldWAnimationMixer, animations, startAction;
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
let dialogueReady = false;
let showDialogue = false;

// Objects and Lights
// Geometries and Materials

const personMainMaterial = new THREE.MeshBasicMaterial({color: 'lightblue'});
const personSecMaterial = new THREE.MeshBasicMaterial({color: 'darkorange'});

floorHoles = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshBasicMaterial({transparent: true, opacity:0}));
floorHoles.rotation.x = -Math.PI / 2;
scene.add(floorHoles);

const warehouseSmNWZ = new THREE.Mesh(new THREE.PlaneGeometry(3,  4.75), new THREE.MeshBasicMaterial({transparent: true, opacity:0.5}));
warehouseSmNWZ.rotation.x = -Math.PI / 2;
warehouseSmNWZ.position.set(2.75, 0.05, 13.25);
const warehouseSmIZ = new THREE.Mesh(new THREE.PlaneGeometry(3,  4.75), new THREE.MeshBasicMaterial({color:0x376d97, transparent: true, opacity:0.5}));
warehouseSmIZ.rotation.x = -Math.PI / 2;
warehouseSmIZ.position.set(5.75, 0.05, 13.25);
warehouseSmIZ.name = 'warehouseSm';

const neighbourFarNWZ = new THREE.Mesh(new THREE.PlaneGeometry(11, 7), new THREE.MeshBasicMaterial({transparent: true, opacity:0.5}));
neighbourFarNWZ.rotation.x = -Math.PI / 2;
neighbourFarNWZ.position.set(0, 0.05, 19.5);
const neighbourFarIZ = new THREE.Mesh(new THREE.PlaneGeometry(3, 7), new THREE.MeshBasicMaterial({color:0x379790, transparent: true, opacity:0.5}));
neighbourFarIZ.rotation.x = -Math.PI / 2;
neighbourFarIZ.position.set(7, 0.05, 19.5);
neighbourFarIZ.name = 'neighbourFar';

const warehouseMdNWZ = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({transparent: true, opacity:0.5}));
warehouseMdNWZ.rotation.x = -Math.PI / 2;
warehouseMdNWZ.position.set(16.75, 0.05, -0.5);
const warehouseMdIZ = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), new THREE.MeshBasicMaterial({color:0x6aca1b, transparent: true, opacity:0.5}));
warehouseMdIZ.rotation.x = -Math.PI / 2;
warehouseMdIZ.position.set(16.75, 0.05, 3.5);
warehouseMdIZ.name = 'warehouseMd';

// width:10.5
const neighbourNearNWZ = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({transparent: true, opacity:0.5}));
neighbourNearNWZ.rotation.x = -Math.PI / 2;
neighbourNearNWZ.rotation.z = 2.55840734641021;
neighbourNearNWZ.position.set(2, 0.05, 6.4);
const neighbourNearIZ = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), new THREE.MeshBasicMaterial({color:0xca881b, transparent: true, opacity:0.5}));
neighbourNearIZ.rotation.x = -Math.PI / 2;
neighbourNearIZ.rotation.z = 2.55840734641021;
neighbourNearIZ.position.set(7, 0.05, 9.7);
neighbourNearIZ.name = 'neighbourNear';
// width:11.025
const homeNWZ = new THREE.Mesh(new THREE.PlaneGeometry(10, 7.2), new THREE.MeshBasicMaterial({transparent: true, opacity:0.5}));
homeNWZ.rotation.x = -Math.PI / 2;
homeNWZ.rotation.z = -1.05159265358979;
// x:8.5, z:0.4
homeNWZ.position.set(9, 0.05, -0.2);
const homeIZ = new THREE.Mesh(new THREE.PlaneGeometry(3, 7.2), new THREE.MeshBasicMaterial({color:0xff0000, transparent: true, opacity:0.5}));
homeIZ.rotation.x = -Math.PI / 2;
homeIZ.rotation.z = -1.05159265358979;
homeIZ.position.set(12.2, 0.05, 5.4);
homeIZ.name = 'home';

const fishermanIZ = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({color:0x2bfbe7, transparent: true, opacity:0.5}));
fishermanIZ.rotation.x = -Math.PI / 2;
fishermanIZ.rotation.z = 2.55840734641021;
fishermanIZ.position.set(10, 0.05, 10);
fishermanIZ.name = 'fisherman_jane_doe';

const infoZones = [neighbourFarIZ, neighbourNearIZ, homeIZ, warehouseMdIZ, warehouseSmIZ];
const npcsZones = [fishermanIZ];

// gui.add(info5.position, 'x', - 100, 100, 0.1);
// gui.add(info5.position, 'z', - 100, 100, 0.1);
// gui.add(cube5.scale, 'x', - 100, 100, 0.1);
// gui.add(cube5.scale, 'y', - 100, 100, 0.1);
// gui.add(cube5.rotation, 'z', - Math.PI, Math.PI, 0.01);

scene.add(warehouseSmNWZ, neighbourFarNWZ, warehouseMdNWZ, neighbourNearNWZ, homeNWZ, warehouseSmIZ, neighbourFarIZ, warehouseMdIZ, neighbourNearIZ, homeIZ, fishermanIZ);

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
        lastKnownPosition = new THREE.Vector3(0, 0, 0);
        personBB = new THREE.Box3().setFromObject(person);
        person.children[0].geometry.userData.obb = new OBB().fromBox3(personBB);
        person.userData.obb = new OBB();
        const center = new THREE.Vector3( 0, 2, 0 );
        const dir =new THREE.Vector3( 0.5, -1, 0.5 );
        dir.normalize();
        personRaycaster = new THREE.Raycaster(center, dir);
        raycasterHelper = new THREE.ArrowHelper(dir, center, 3, 0xffffff);
        scene.add(raycasterHelper);
    },
    (progress) => console.log(progress),
    (error) => console.log(error)
);

gltfLoader.load('/models/sitting-person.glb',
    (gltf) => {
        const oldWoman = gltf.scene.children[0];
        console.log('oldWoman: ', gltf);
        oldWoman.children[1].material = personSecMaterial;
        oldWoman.children[0].material = personMainMaterial;

        oldWoman.rotation.z = -Math.PI / 4;
        oldWoman.position.z = 10;
        oldWoman.position.x = 10;
        oldWAnimationMixer = new THREE.AnimationMixer(oldWoman);
        const oldWAnimations = gltf.animations;
        const oldWActions = {
            sit: {weight: 1}
        };
        oldWActions.sit.action = oldWAnimationMixer.clipAction(oldWAnimations[0]);
        oldWActions.sit.action.play();
        scene.add(oldWoman);
    },
    (progress) => console.log(progress),
    (error) => console.log(error)
);

// gltfLoader.load('/models/floor.glb', (gltf) => {
//     floorHoles = gltf.scene.children[0];
//     floorHoles.position.set(0,0,0);
//     // floorHoles.material = new THREE.MeshBasicMaterial({transparent: true, opacity: 0});
//     scene.add(floorHoles);
// })

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(1, 0.25, 0)
scene.add(directionalLight);

// === PIXI.JS SETUP ===
// Create PixiJS renderer that shares the WebGL context with Three.js
const pixiRenderer = new WebGLRenderer({ alpha: true });

// Initialize PixiJS renderer with shared context
await pixiRenderer.init({
    width: sizes.width,
    height: sizes.height,
    context: canvas.getContext('webgl2'),
    clearBeforeRender: false,
    canvas: canvas
});

// Create PixiJS scene graph
const bgColorStage = new Container();
const bgColor = new Graphics().rect(0, 0, sizes.width, sizes.height).fill(0xac6d81);
bgColorStage.addChild(bgColor);

const bgStage = new Container();
const fgStage = new Container();

Assets.add({
    alias: 'background',
    src: '/lower-layer.png',
});
Assets.add({
    alias: 'foreground',
    src: '/upper-layer.png',
});

// Load the assets and get a resolved promise once both are loaded
const texturesPromise = Assets.load(['background', 'foreground']); // => Promise<{flowerTop: Texture, eggHead: Texture}>

// When the promise resolves, we have the texture!
texturesPromise.then((textures) => {
    // Create a new Sprite from the resolved loaded Textures
    background = Sprite.from(textures.background);
    bgStage.addChild(background);

    foreground = Sprite.from(textures.foreground);

    fgStage.addChild(foreground);
});


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

    pixiRenderer.resize(sizes.width, sizes.height);
});

window.addEventListener('keydown', (e) => {
    if((e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD') && !showDialogue) {
        if(keyDownMovement !== e.code){
            keyDownMovement = e.code;
        }
        pressCheck.repeat = e.repeat;
        pressCheck.lastRepeat = clock.getElapsedTime();
    } else {
        if(e.code === 'KeyE' && dialogueReady) {
            if(personRaycaster.intersectObjects(infoZones).length > 0) {
                setStarter(personRaycaster.intersectObjects(infoZones)[0].object.name, 'place');
            } else if(personRaycaster.intersectObjects(npcsZones).length > 0) {
                setStarter(personRaycaster.intersectObjects(npcsZones)[0].object.name, 'npc');
            }
            starter.style.display = 'flex';
            showDialogue = true;
        }
        if(e.code === 'Escape' && showDialogue) {
            resetDialogueStep();
            starter.style.display = 'none';
            if(otherActor) otherActor.style.display = 'none';
            showDialogue = false;
        }
        if((e.code === 'ArrowRight' || e.code === 'ArrowLeft') && showDialogue) {
            e.preventDefault();
            goNextDialogue(e.code)
        }
    }
})

window.addEventListener('keyup', (e) => {
    if(!showDialogue) {
        keyUpMovement = e.code;
    }
})

function tick() {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
    let prevPos;

    // Direction management (keypress based direction, including direction change)
    if(person) {
        let nextDirection = personRaycaster.ray.direction;
        prevPos = new THREE.Vector3(person.position.x, person.position.y, person.position.z);

        // Proximity check
        if(personRaycaster.intersectObjects(infoZones).length > 0 || personRaycaster.intersectObjects(npcsZones).length > 0) {
            if(showDialogue && dialogueReady) {
                pressTip.style.display = 'none';
                dialogueReady = false;
            } else if(!showDialogue && !dialogueReady){
                pressTip.style.display = 'block';
                dialogueReady = true;
            }
        } else if(personRaycaster.intersectObjects(infoZones).length === 0 && dialogueReady) {
            pressTip.style.display = 'none';
            dialogueReady = false;
        }

        // KeyUp
        if(keyUpMovement){
            if ((keyUpMovement === 'KeyW' || keyUpMovement === 'KeyS' || keyUpMovement === 'KeyA' || keyUpMovement === 'KeyD')) {
                keyMap.splice(keyMap.indexOf(keyUpMovement), 1);
                if (keyUpMovement === keyDownMovement) {
                    keyDownMovement = null;
                }
                keyUpMovement = null;
                if (keyMap.length === 0 || (keyMap.length > 0 && !keyDownMovement)) {
                    keyDownMovement = null;
                    keyMap.length = 0;
                    setWeight(actions.idle.action, 1);
                    actions.idle.action.time = 1;
                    actions.walk.action.crossFadeTo(actions.idle.action, 0.35, true);
                    startAction = 'idle';
                }
            }
        }
        // KeyDown
        if(keyDownMovement) {
            // Avoid continuous movement when no key is pressed
            if ((keyDownMovement === 'KeyW' || keyDownMovement === 'KeyS' || keyDownMovement === 'KeyA' || keyDownMovement === 'KeyD') && (pressCheck.repeat && elapsedTime - pressCheck.lastRepeat > 0.4)) {
                keyDownMovement = null;
                keyMap.length = 0;
                setWeight(actions.idle.action, 1);
                actions.idle.action.time = 1;
                actions.walk.action.crossFadeTo(actions.idle.action, 0.35, true);
                startAction = 'idle';
            }

            // KeyDown and movement
            if ((keyDownMovement === 'KeyW' || keyDownMovement === 'KeyS' || keyDownMovement === 'KeyA' || keyDownMovement === 'KeyD') && startAction === 'idle') {
                setWeight(actions.walk.action, 1);
                actions.walk.action.time = 1;
                actions.idle.action.crossFadeTo(actions.walk.action, 0.35, true);
                actions.walk.action.play();
                startAction = 'walk';
                startDelay = elapsedTime;
            }

            // Avoid opposite keystrokes to be pressed at the same time
            if ((keyDownMovement === 'KeyW' || keyDownMovement === 'KeyS' || keyDownMovement === 'KeyA' || keyDownMovement === 'KeyD') && !keyMap.includes(keyDownMovement)) {
                if (keyMap.length < 2) {
                    keyMap.push(keyDownMovement);
                    if (keyDownMovement === 'KeyW' && keyMap.includes('KeyS')) {
                        keyMap.splice(keyMap.indexOf('KeyS'), 1);
                    }
                    if (keyDownMovement === 'KeyS' && keyMap.includes('KeyW')) {
                        keyMap.splice(keyMap.indexOf('KeyW'), 1);
                    }
                    if (keyDownMovement === 'KeyA' && keyMap.includes('KeyD')) {
                        keyMap.splice(keyMap.indexOf('KeyD'), 1);
                    }
                    if (keyDownMovement === 'KeyD' && keyMap.includes('KeyA')) {
                        keyMap.splice(keyMap.indexOf('KeyA'), 1);
                    }
                }
            }
        }
        // Movement
        if(keyMap.length !== 0) {

            if(personRaycaster.intersectObject(floorHoles).length === 0
                || personRaycaster.intersectObject(warehouseSmNWZ).length !== 0
                || personRaycaster.intersectObject(neighbourFarNWZ).length !== 0
                || personRaycaster.intersectObject(warehouseMdNWZ).length !== 0
                || personRaycaster.intersectObject(neighbourNearNWZ).length !== 0
                || personRaycaster.intersectObject(homeNWZ).length !== 0
            ) {
                distance = 0;
            // } else if (rotationFraction !== 15) {
            //     distance = 0.015;
            } else {
                distance = 0.025;
            }

            if(keyMap.includes('KeyW') && keyMap.includes('KeyD')) {
                if(positionDirection(positionStart, 4) !== 0 && rotationFraction === 15) {
                    turn = 4;
                    rotationFactor = calcRotationFactor(positionStart, turn);
                    positionStart = 4;
                    nextDirection = direction.wd;
                }

                if(elapsedTime - startDelay > delay) {
                    person.position.z += -distance;
                    background.y += 0.935/2;
                    foreground.y += 0.935/2;
                    background.x -= 1.61/2;
                    foreground.x -= 1.61/2;
                }
            } else if(keyMap.includes('KeyW') && keyMap.includes('KeyA')) {
                if(positionDirection(positionStart, 6) !== 0 && rotationFraction === 15) {
                    turn = 6;
                    rotationFactor = calcRotationFactor(positionStart, turn);
                    positionStart = 6;
                    nextDirection = direction.wa;
                }

                if(elapsedTime - startDelay > delay) {
                    person.position.x += -distance;
                    background.y += 0.935/2;
                    foreground.y += 0.935/2;
                    background.x += 1.61/2;
                    foreground.x += 1.61/2;
                }
            } else if(keyMap.includes('KeyS') && keyMap.includes('KeyD')) {
                if(positionDirection(positionStart, 2) !== 0 && rotationFraction === 15) {
                    turn = 2;
                    rotationFactor = calcRotationFactor(positionStart, turn);
                    positionStart = 2;
                    nextDirection = direction.sd;
                }
                if(elapsedTime - startDelay > delay) {
                    person.position.x += distance;
                    background.y -= 0.935/2;
                    foreground.y -= 0.935/2;
                    background.x -= 1.61/2;
                    foreground.x -= 1.61/2;
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
                    nextDirection = direction.sa;
                }

                if(elapsedTime - startDelay > delay) {
                    person.position.z += distance;
                    background.y -= 0.935/2;
                    foreground.y -= 0.935/2;
                    background.x += 1.61/2;
                    foreground.x += 1.61/2;
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
                    nextDirection = direction.s;
                }
                if(elapsedTime - startDelay > delay) {
                    person.position.x += distance;
                    person.position.z += distance;
                    background.y -= 0.935;
                    foreground.y -= 0.935;
                }
            } else if(keyMap.includes('KeyW')) {
                if(positionDirection(positionStart, 5) !== 0 && rotationFraction === 15) {
                    turn = 5;
                    rotationFactor = calcRotationFactor(positionStart, turn);
                    positionStart = 5;
                    nextDirection = direction.w;
                }
                if(elapsedTime - startDelay > delay) {
                    person.position.x += -distance;
                    person.position.z += -distance;
                    background.y += 0.935;
                    foreground.y += 0.935;
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
                    nextDirection = direction.a;
                }
                if(elapsedTime - startDelay > delay) {
                    person.position.x += -distance;
                    person.position.z += distance;
                    background.x += 1.61;
                    foreground.x += 1.61;
                }
            } else if(keyMap.includes('KeyD')) {
                if(positionDirection(positionStart, 3) !== 0 && rotationFraction === 15) {
                    turn = 3;
                    rotationFactor = calcRotationFactor(positionStart, turn);
                    positionStart = 3;
                    nextDirection = direction.d;
                }
                if(elapsedTime - startDelay > delay) {
                    person.position.x += distance;
                    person.position.z += -distance;
                    background.x -= 1.61;
                    foreground.x -= 1.61;
                }
            }

            if(elapsedTime - startDelay > delay) {
                camera.position.x = person.position.x + 50;
                camera.position.z = person.position.z + 50;
            }

            person.userData.obb.copy(person.children[0].geometry.userData.obb);
            person.userData.obb.applyMatrix4(person.matrixWorld);

            personRaycaster.set(person.userData.obb.center, nextDirection);
            raycasterHelper.dispose();
            scene.remove(raycasterHelper);
            raycasterHelper = new THREE.ArrowHelper(nextDirection, person.userData.obb.center, 3, 0xffffff);
            scene.add(raycasterHelper);
        }
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

    if(oldWAnimationMixer) {
        oldWAnimationMixer.update(deltaTime);
    }

    if(elapsedTime >= lastSecond + 1) lastSecond = elapsedTime;

    // Render PixiJS scene
    pixiRenderer.resetState();
    pixiRenderer.render({ container: bgColorStage, clear:false });

    pixiRenderer.resetState();
    pixiRenderer.render({ container: bgStage, clear:false });
    // Render Three.js scene
    renderer.resetState();
    renderer.render(scene, camera);

    pixiRenderer.resetState();
    pixiRenderer.render({ container: fgStage, clear:false });

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
    // console.log('turn factor: ', positionDirection(positionStart, positionEnd))
    return (-Math.PI / 4) * positionDirection(positionStart, positionEnd);
}

// Animate
tick();