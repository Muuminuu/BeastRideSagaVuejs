import { DamageType } from './Enums';
import type { Stats } from './Stats';
import type { Ability } from './Ability';

export interface Combatant {
  stats: Stats;
  abilities: Ability[];
  takeDamage(amount: number, type: DamageType): void;
  useAbility(ability: Ability, target: Combatant): void;
}