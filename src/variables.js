import {Vector3} from "three";

const dialogueBoxNpc = document.getElementById('dialogue-box-npc');
const dialogueBoxMc = document.getElementById('dialogue-box-mc');
const textNpc = document.getElementById('text-npc');
const textMc = document.getElementById('text-mc');
const lineNpc = document.getElementById('line-npc');
const lineMc = document.getElementById('line-mc');
const tagName = document.getElementById('tag-name');
const tagDescription = document.getElementById('tag-description');
const descriptionBoxPlace = document.getElementById('description-box-place');
const textPlace = document.getElementById('text-place');
const linePlace = document.getElementById('line-place');
const npcName = document.getElementById('npc-name');
const placeName = document.getElementById('place-name');
const pressTip = document.getElementById('press-tip');

const direction = {
    w: new Vector3( -0.5, -1, -0.5 ),
    a: new Vector3( -0.5, -1, 0.5 ),
    s: new Vector3( 0.5, -1, 0.5 ),
    d: new Vector3( 0.5, -1, -0.5 ),
    wd: new Vector3( 0, -1, -1 ),
    wa: new Vector3( -1, -1, 0 ),
    sd: new Vector3( 1, -1, 0 ),
    sa: new Vector3( 0, -1, 1 ),
}

direction.w = direction.w.normalize();
direction.a = direction.a.normalize();
direction.s = direction.s.normalize();
direction.d = direction.d.normalize();
direction.wd = direction.wd.normalize();
direction.wa = direction.wa.normalize();
direction.sd = direction.sd.normalize();
direction.sa = direction.sa.normalize();

export { dialogueBoxNpc, textNpc, lineNpc, dialogueBoxMc,textMc, lineMc, tagName, tagDescription, descriptionBoxPlace, textPlace, linePlace, npcName, placeName, direction, pressTip };