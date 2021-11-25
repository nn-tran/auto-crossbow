import { once, hooks, Game, Actor, Weapon, Debug, Utility, printConsole, GlobalVariable } from "skyrimPlatform"
import { createFunctionIfEquip } from "util"

var idShoot: number = -1;
var idReload: number = -1;
var idCancel: number = -1;
var ammo: number = -1;
var currentAmmo: number;
var reloading = false;
var firing = false;

function init(pl: Actor | null, w: Weapon){
	const glob = GlobalVariable.from(Game.getFormFromFile(0x803, "autocrossbow.esm"))
	if (glob) ammo = glob.getValue();
	currentAmmo = ammo;
	idShoot = hooks.sendAnimationEvent.add({
		enter(ctx) {
      firing = true;
    },
		leave(ctx) {}
	}, /* minSelfId = */ 0x14, /* maxSelfId = */ 0x14, /*eventPattern = */ "crossbow*");

	idReload = hooks.sendAnimationEvent.add({
		enter(ctx) {
			if (reloading){
				ctx.animEventName = "";
			} else if (currentAmmo > 1 && firing){
				currentAmmo--;
				once("update", () => {
					const player = Actor.from(Game.getFormEx(0x14));
					const w = player?.getEquippedWeapon(false);
					w?.fire(player, null);
				});
				ctx.animEventName = "attackStop";
			} else if (firing) {
				reloading = true;
				once("update", () => {
					Utility.wait(2.25).then(()=>{
						currentAmmo = ammo;
						reloading = false;
					});
				});	
			}
			
		},
		leave(ctx) {}
	}, /* minSelfId = */ 0x14, /* maxSelfId = */ 0x14, /*eventPattern = */ "attackRelease");
	idCancel = hooks.sendAnimationEvent.add({
    enter(ctx) {
      firing = false;
    },
		leave(ctx) {}
	}, /* minSelfId = */ 0x14, /* maxSelfId = */ 0x14, /*eventPattern = */ "attackStop");
}

function equip(pl: Actor | null, w: Weapon){
	if (idShoot < 0)
		init(pl, w);
}

function unequip(pl: Actor | null){
	if (idShoot >= 0){
		hooks.sendAnimationEvent.remove(idShoot);
		idShoot = -1;
		hooks.sendAnimationEvent.remove(idReload);
		idReload = -1;
    hooks.sendAnimationEvent.remove(idCancel);
		idCancel = -1;
	}
}

export const main = createFunctionIfEquip(init, equip, unequip, 0x801, "autocrossbow.esm");