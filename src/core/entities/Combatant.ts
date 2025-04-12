// src/core/entities/Combatant.ts
import { Entity } from './Entity';
import { ElementType } from '../types/ElementalTypes';
import type { Stats } from '../types/Stats';
import type { Ability } from '../types/Ability';

export interface Combatant {
  stats: Stats;
  abilities: Ability[];
  takeDamage(amount: number, type: ElementType): void;
  useAbility(ability: Ability, target: Combatant): void;
}