import { Entity } from './Entity';
import { Combatant } from '../types/Interfaces';
import { Stats } from '../types/Stats';
import { Ability } from '../types/Ability';
import { AnimalType, DamageType, GrowthStage } from '../types/Enums';

export class AnimalSpirit extends Entity implements Combatant {
    stats: Stats;
    abilities: Ability[];
    type: AnimalType;
    growthStage: GrowthStage;
    experience: number;

    constructor(id: string, name: string, type: AnimalType, stats: Stats) {
        super(id, name);
        this.stats = stats;
        this.abilities = [];
        this.type = type;
        this.growthStage = GrowthStage.Juvenile;
        this.experience = 0;
    }

    takeDamage(amount: number, type: DamageType): void {
        this.stats.currentHealth = Math.max(0, this.stats.currentHealth - amount);
    }

    useAbility(ability: Ability, target: Combatant): void {
        if (ability.currentCooldown > 0) return;

        const damage = Math.floor(ability.power * (this.stats.attack / 100));
        target.takeDamage(damage, ability.damageType);

        ability.currentCooldown = ability.cooldown;
    }
}