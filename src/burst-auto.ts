import { once, hooks, Game, Actor, Debug, Utility, Input, GlobalVariable, printConsole } from "skyrimPlatform"
import { createFunctionIfEquip, saveCurrentAmmo } from "util"

var idShoot: number = -1;
var idReload: number = -1;
var idCancel: number = -1;
var rof = -1;
var ammo = -1;
var burstSize = -1;
var currentAmmo: number;
var currentBurst: number;
var reloading = false;
var firing = false;

function addHooks(){
	const glob = GlobalVariable.from(Game.getFormFromFile(0x803, "autocrossbow.esm"))
	if (glob) ammo = glob.getValue();
	const glob2 = GlobalVariable.from(Game.getFormFromFile(0x804, "autocrossbow.esm"))
	if (glob2) rof = glob2.getValue();
	const glob3 = GlobalVariable.from(Game.getFormFromFile(0x805, "autocrossbow.esm"))
	if (glob3) burstSize = glob3.getValue();
	const glob4 = GlobalVariable.from(Game.getFormFromFile(0x806, "autocrossbow.esm"))
	if (glob4) currentAmmo = glob4.getValue();
  else currentAmmo = ammo;
	currentBurst = burstSize;
  idShoot = hooks.sendAnimationEvent.add({
		enter(ctx) {
      if (currentBurst <=0){
        return;
      }
			firing = true;
      once('update', () => {
        Utility.wait(rof).then(()=>{
          if (Input.isKeyPressed(0x100) && firing){
            currentBurst--;
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
			if (reloading){
				ctx.animEventName = "";
			}
      if (currentAmmo > 1){
				currentBurst = burstSize;
				currentAmmo--;
        ctx.animEventName = "attackStop";
			}
			else {
				reloading = true;
				once("update", () => {
					Utility.wait(2.25).then(()=>{
						currentAmmo = ammo;
						currentBurst = burstSize;
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

function addHooksEquip(){
	if (idShoot < 0)
		addHooks();
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

export const main = createFunctionIfEquip(addHooks, addHooksEquip, removeHooks, 0x802, "autocrossbow.esm");