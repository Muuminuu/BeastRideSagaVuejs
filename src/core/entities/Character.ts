import { Entity } from './Entity';
import { Combatant } from './Combatant';
import { Stats } from '../types/Stats';
import { Ability } from '../types/Ability';
import { ElementType } from '../types/ElementalTypes';

export abstract class Character extends Entity implements Combatant {
  stats: Stats;
  abilities: Ability[];
  level: number;
  experience: number;
  
  constructor(id:string, name:string, stats:Stats) {
    super(id, name);
    this.stats = stats;
    this.abilities = [];
    this.level = 1;
    this.experience = 0;
  }
  
  takeDamage(amount: number, type: ElementType): void {
    // Logique de base pour prendre des dégâts
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - amount);
  }
  
  useAbility(ability: Ability, target: Combatant): void {
    // Logique d'utilisation d'une capacité
  }
}