import { DESIGNS } from './designs.js';

// Original eight companions plus three companions rescued during the campaign.
export const ROSTER = [
  {
    "id": "pyrojaw",
    "name": "Pyrojaw",
    "element": "Fire",
    "color": "#ff8747",
    "dark": "#753d28",
    "accent": "#ffd378",
    "speed": 0.059
  },
  {
    "id": "voltantis",
    "name": "Voltantis",
    "element": "Electric",
    "color": "#dbfc65",
    "dark": "#697b30",
    "accent": "#f9ffe0",
    "speed": 0.085
  },
  {
    "id": "glaciolith",
    "name": "Glaciolith",
    "element": "Ice",
    "color": "#8edce5",
    "dark": "#386276",
    "accent": "#e0ffff",
    "speed": 0.036
  },
  {
    "id": "zephyrix",
    "name": "Zephyrix",
    "element": "Wind",
    "color": "#91d9cb",
    "dark": "#3d706d",
    "accent": "#f1fff6",
    "speed": 0.073
  },
  {
    "id": "terrakhan",
    "name": "Terrakhan",
    "element": "Earth",
    "color": "#87986a",
    "dark": "#414b33",
    "accent": "#d2df9d",
    "speed": 0.033
  },
  {
    "id": "noxshade",
    "name": "Noxshade",
    "element": "Shadow",
    "color": "#ab82d4",
    "dark": "#332940",
    "accent": "#edb4ff",
    "speed": 0.071
  },
  {
    "id": "aqualance",
    "name": "Aqualance",
    "element": "Water",
    "color": "#699fc3",
    "dark": "#203f61",
    "accent": "#c5f4fb",
    "speed": 0.064
  },
  {
    "id": "ferrodrake",
    "name": "Ferrodrake",
    "element": "Steel",
    "color": "#c6cfd4",
    "dark": "#555e6a",
    "accent": "#f37d77",
    "speed": 0.057
  }
];
for(const id of ['mycora','lumivern','chronowl']) ROSTER.push({id,speed:.073,...DESIGNS[id]});
for(const fighter of ROSTER)Object.assign(fighter,DESIGNS[fighter.id]);
export const findFighter=id=>ROSTER.find(f=>f.id===id)||ROSTER[0];
