import { once, hooks, Game, Actor, Weapon, Debug, Utility, printConsole, GlobalVariable } from "skyrimPlatform"
import { createFunctionIfEquip } from "util"

var id: number = -1;
var ammo: number = -1;
var currentAmmo: number;
var reloading = false;

function init(pl: Actor | null, w: Weapon){
	const glob = GlobalVariable.from(Game.getFormFromFile(0x803, "autocrossbow.esm"))
	if (glob) ammo = glob.getValue();
	currentAmmo = ammo;
	id = hooks.sendAnimationEvent.add({
		enter(ctx) {
			if (reloading){
				ctx.animEventName = "";
			} else if (currentAmmo > 1){
				currentAmmo--;
				once("update", () => {
					const player = Actor.from(Game.getFormEx(0x14));
					const w = player?.getEquippedWeapon(false);
					w?.fire(player, null);
				});
				ctx.animEventName = "attackStop";
			} else {
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
}

function equip(pl: Actor | null, w: Weapon){
	if (id < 0)
		init(pl, w);
}

function unequip(pl: Actor | null){
	if (id >= 0){
		hooks.sendAnimationEvent.remove(id);
		id = -1;
	}
}

export const main = createFunctionIfEquip(init, equip, unequip, 0x801, "autocrossbow.esm");