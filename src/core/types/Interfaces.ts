import { DamageType } from './Enums';
import type { Stats } from './Stats';
import type { Ability } from './Ability';

export interface Combatant {
  id: string;  // Ajout de l'ID pour le suivi dans le système de combat
  name: string; // Ajout du nom pour l'affichage dans les messages
  stats: Stats;
  abilities: Ability[];
  takeDamage(amount: number, type: DamageType): void;
  useAbility(ability: Ability, target: Combatant): void;
}