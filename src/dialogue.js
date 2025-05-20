import {dialogueBoxMc, dialogueBoxNpc, textMc, textNpc, lineMc, lineNpc, descriptionBoxPlace, textPlace, linePlace} from "./variables.js";
import {npcs, places} from "./npcsPlaces.js";

let dialogueStep = 0;
let starter;
let otherActor;
let lines;
let dialogue;

function setStarter(speakerName, type) {
    switch (type) {
        case 'NPC':
            const npc = npcs.filter(el => el.name === speakerName)[0];
            dialogue = npc.dialogue;
            lines = Object.keys(dialogue);

            if (dialogue[0].actor === 'mc') {
                lineMc.textContent = dialogue[0].line + ' [' + String.fromCharCode(8594) + ']';
                starter = dialogueBoxMc;
                otherActor = dialogueBoxNpc;
            } else {
                lineNpc.textContent = dialogue[0].line + ' [' + String.fromCharCode(8594) + ']';
                otherActor = dialogueBoxMc;
                starter = dialogueBoxNpc;
            }
            break;
        case 'PLACE':
            const place = places.filter(el => el.name === speakerName)[0];
            dialogue = place.longDescription;
            lines = Object.keys(dialogue);
            if(dialogue.length > 1) {
                linePlace.textContent = dialogue[0] + ' [' + String.fromCharCode(8594) + ']';
            } else {
                linePlace.textContent = dialogue[0] + ' [Esc to close]';
            }
            starter = descriptionBoxPlace;
    }
}

function goNextDialogue(e) {
    switch(e) {
        case 'ArrowRight':
            if(dialogueStep < lines.length - 1) {
                dialogueStep++;
            }
            break;
        case 'ArrowLeft':
            if(dialogueStep > 0) {
                dialogueStep--;
            }
            break;
    }

    if(!dialogue[0].line) {
        textPlace.scrollTop = 0;
        linePlace.textContent = dialogue[dialogueStep];
    } else {
        if(dialogue[dialogueStep].actor === 'npc') {
            textMc.scrollTop = 0;
            dialogueBoxMc.style.display = 'none';
            dialogueBoxNpc.style.display = 'flex';
            lineNpc.textContent = dialogue[dialogueStep].line;
        } else {
            textNpc.scrollTop = 0;
            dialogueBoxNpc.style.display = 'none';
            dialogueBoxMc.style.display = 'flex';
            lineMc.textContent = dialogue[dialogueStep].line;
        }
    }

    if(dialogueStep === lines.length - 1) {
        lineNpc.textContent += ' [Esc to close]';
        lineMc.textContent += ' [Esc to close]';
        linePlace.textContent += ' [Esc to close]';
    } else {
        lineNpc.textContent += ' [' + String.fromCharCode(8594) + ']';
        lineMc.textContent +=  ' [' + String.fromCharCode(8594) + ']';
        linePlace.textContent +=  ' [' + String.fromCharCode(8594) + ']';
    }
}

function resetDialogueStep() {
    dialogueStep = 0;
    console.log(dialogue)
    if(!dialogue[0].line) {
        if(dialogue.length > 1) {
            linePlace.textContent = dialogue[0] + ' [' + String.fromCharCode(8594) + ']';
        } else {
            linePlace.textContent = dialogue[0] + ' [Esc to close]';
        }
        starter = descriptionBoxPlace;
    } else {
        if(dialogue[0].actor === 'mc') {
            lineMc.textContent = dialogue[0].line + ' [' + String.fromCharCode(8594) + ']';
            starter = dialogueBoxMc;
            otherActor = dialogueBoxNpc;
        } else {
            lineNpc.textContent = dialogue[0].line + ' [' + String.fromCharCode(8594) + ']';
            otherActor = dialogueBoxMc;
            starter = dialogueBoxNpc;
        }
    }
}

export {starter, otherActor, resetDialogueStep, goNextDialogue, setStarter};