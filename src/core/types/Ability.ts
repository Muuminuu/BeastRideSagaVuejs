import { DamageType, TargetType } from './Enums';

export interface Ability {
  id: string;
  name: string;
  description: string;
  damageType: DamageType;
  power: number;
  cooldown: number;
  currentCooldown: number;
  targetType: TargetType;
}