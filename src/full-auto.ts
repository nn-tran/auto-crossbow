import { once, hooks, Game, Actor, Debug, Utility, Input, GlobalVariable } from "skyrimPlatform"
import { createFunctionIfEquip, saveCurrentAmmo } from "util"

var idShoot: number = -1;
var idReload: number = -1;
var idCancel: number = -1;
var ammo: number = -1;
var rof: number = -1;
var currentAmmo: number;
var reloading = false;
var firing = false;

function addHooks(){
  if (idShoot >= 0)
    return;
  const glob = GlobalVariable.from(Game.getFormFromFile(0x803, "autocrossbow.esm"))
	if (glob) ammo = glob.getValue();
	const glob2 = GlobalVariable.from(Game.getFormFromFile(0x804, "autocrossbow.esm"))
	if (glob2) rof = glob2.getValue();
  const glob4 = GlobalVariable.from(Game.getFormFromFile(0x806, "autocrossbow.esm"))
	if (glob4) currentAmmo = glob4.getValue();
  else currentAmmo = ammo;
	idShoot = hooks.sendAnimationEvent.add({
		enter(ctx) {
      if (currentAmmo <=0){
        return;
      }
      firing = true;
      once('update', () => {
        Utility.wait(rof).then(()=>{
          if (Input.isKeyPressed(0x100) && firing){
            currentAmmo--;
            const player = Actor.from(Game.getFormEx(0x14));
            const w = player?.getEquippedWeapon(false);
            w?.fire(player, null);
            Debug.sendAnimationEvent(player, ctx.animEventName);
          }
        });
      });
    },
		leave(ctx) {}
	}, /* minSelfId = */ 0x14, /* maxSelfId = */ 0x14, /*eventPattern = */ "crossbow*");
  idReload = hooks.sendAnimationEvent.add({
    enter(ctx) {
      if (currentAmmo > 0)
        ctx.animEventName = "attackStop";
      else {
        once("update", () => {
          Utility.wait(2.25).then(()=>{
            currentAmmo = ammo;
            reloading = false;
          });
        });	
        ctx.animEventName = "reloadStart";
      }
    },
		leave(ctx) {
      saveCurrentAmmo(currentAmmo);
    }
	}, /* minSelfId = */ 0x14, /* maxSelfId = */ 0x14, /*eventPattern = */ "attackRelease");
  idCancel = hooks.sendAnimationEvent.add({
    enter(ctx) {
      firing = false;
    },
		leave(ctx) {
      saveCurrentAmmo(currentAmmo);
    }
	}, /* minSelfId = */ 0x14, /* maxSelfId = */ 0x14, /*eventPattern = */ "attackStop");
}

function removeHooks(){
	if (idShoot >=0){
		hooks.sendAnimationEvent.remove(idShoot);
		idShoot = -1;
		hooks.sendAnimationEvent.remove(idReload);
		idReload = -1;
    hooks.sendAnimationEvent.remove(idCancel);
		idCancel = -1;
	}
}

export const main = createFunctionIfEquip(addHooks, removeHooks, 0x800, "autocrossbow.esm");
