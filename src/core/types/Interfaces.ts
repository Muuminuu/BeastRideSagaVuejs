import { DamageType } from './Enums';
import { Stats } from './Stats';
import { Ability } from './Ability';

export interface Combatant {
  stats: Stats;
  abilities: Ability[];
  takeDamage(amount: number, type: DamageType): void;
  useAbility(ability: Ability, target: Combatant): void;
}