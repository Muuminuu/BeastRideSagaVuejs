import { Entity } from './Entity';
import { Combatant } from '../types/Interfaces';
import { Stats } from '../types/Stats';
import { Ability } from '../types/Ability';
import { DamageType, EnemyType } from '../types/Enums';

export class Enemy extends Entity implements Combatant {
  stats: Stats;
  abilities: Ability[];
  type: EnemyType;
  
  constructor(id: string, name: string, type: EnemyType, stats: Stats) {
    super(id, name);
    this.stats = stats;
    this.abilities = [];
    this.type = type;
  }
  
  takeDamage(amount: number, type: DamageType): void {
    // Version simple pour démarrer
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - amount);
  }
  
  useAbility(ability: Ability, target: Combatant): void {
    // Version simple pour démarrer
    if (ability.currentCooldown > 0) return;
    
    const damage = Math.floor(ability.power * (this.stats.attack / 100));
    target.takeDamage(damage, ability.damageType);
    
    ability.currentCooldown = ability.cooldown;
  }
  
  selectAbility(): Ability {
    // IA très simple : sélectionne la première capacité disponible
    return this.abilities.find(a => a.currentCooldown === 0) || this.abilities[0];
  }
}