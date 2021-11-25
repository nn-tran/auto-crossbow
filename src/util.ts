import { on, once, Game, Actor, Weapon, Keyword, Debug, Utility, GlobalVariable, printConsole} from "skyrimPlatform"

export function saveCurrentAmmo(currentAmmo: number){
  once('update', ()=>{
    const cAmmo = GlobalVariable.from(Game.getFormFromFile(0x806, "autocrossbow.esm"))
    cAmmo?.setValue(currentAmmo)
  });
}

export function createFunctionIfEquip(init: (pl: Actor | null, w: Weapon)=>void, equip: (pl: Actor | null, w: Weapon)=>void, unequip: (pl: Actor | null)=>void, id: number, file: string): ()=>void{
  return ()=>{
    var itemId: number = -1;
    once('scriptInit', () => {
      const pl = Actor.from(Game.getFormEx(0x14));
      const kw = Keyword.from(Game.getFormFromFile(id, file));
      const w = pl?.getEquippedWeapon(false);
      if (itemId < 0 && w?.hasKeyword(kw)){
        itemId = w.getFormID();
        init(pl, w);
      }
    });
    on('equip', (event) => {
      const plId = event.actor.getFormID();
      if (plId !== Game.getFormEx(0x14)?.getFormID()) return;
      const wId = event.baseObj.getFormID();
      Utility.waitMenuMode(0.1).then(() => {//wait for unequip event and equip animation to finish
        const pl = Actor.from(Game.getFormEx(0x14));
        const kw = Keyword.from(Game.getFormFromFile(id, file));
        const w = Weapon.from(Game.getFormEx(wId));
        if (itemId < 0 && w?.hasKeyword(kw)) {
          itemId = w.getFormID();
          equip(pl, w);
        }
        
      });
    });

    on('unequip', (event) => {
      const pl = Actor.from(event.actor);
      if (!pl || pl.getFormID() !== Game.getFormEx(0x14)?.getFormID()) return;
      if (event.baseObj.getFormID() === itemId){
        unequip(pl);
        itemId = -1;
      }
    });
  }
}