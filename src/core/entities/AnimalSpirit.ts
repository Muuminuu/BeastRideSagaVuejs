import { Entity } from './Entity';
import type { Combatant } from './Combatant';
import type { Stats } from '../types/Stats';
import type { Ability } from '../types/Ability';
import { TypeEffectiveness } from '../types/ElementalTypes';
import { ElementType, AnimalClass } from '../types/ElementalTypes';

export enum GrowthStage {
  Juvenile = 'juvenile',
  Adolescent = 'adolescent',
  Adult = 'adult',
  Elder = 'elder'
}

export class AnimalSpirit extends Entity implements Combatant {
  stats: Stats;
  abilities: Ability[];
  elementType: ElementType;
  animalClass: AnimalClass;
  growthStage: GrowthStage;
  experience: number;
  
  constructor(id: string, name: string, elementType: ElementType, animalClass: AnimalClass, stats: Stats) {
    super(id, name);
    this.stats = stats;
    this.abilities = [];
    this.elementType = elementType;
    this.animalClass = animalClass;
    this.growthStage = GrowthStage.Juvenile;
    this.experience = 0;
  }
  
  takeDamage(amount: number, type: DamageType): { damage: number; effectiveness: number } {
    // Conversion de DamageType vers ElementType
    const elementType = this.convertDamageTypeToElementType(type);
    
    // Calcul des dégâts avec prise en compte des efficacités
    const effectiveness = TypeEffectiveness[elementType][this.elementType];
    const adjustedDamage = Math.floor(amount * effectiveness);
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - adjustedDamage);
    
    return {
      damage: adjustedDamage,
      effectiveness: effectiveness
    };
  }
  
  useAbility(ability: Ability, target: Combatant): { damage: number; effectiveness: number } | void {
    if (ability.currentCooldown > 0) return;
    
    // Calcul des dégâts basé sur l'attaque et la puissance de la capacité
    const baseDamage = Math.floor(ability.power * (this.stats.attack / 100));
    
    // Appliquer les dégâts à la cible
    const result = target.takeDamage(baseDamage, ability.damageType);
    
    // Mettre la capacité en cooldown
    ability.currentCooldown = ability.cooldown;
    
    return result;
  }
  
  // Ajouter cette méthode utilitaire dans la classe
  private convertDamageTypeToElementType(damageType: DamageType): ElementType {
    switch (damageType) {
      case DamageType.Physical: return ElementType.Normal;
      case DamageType.Fire: return ElementType.Fire;
      case DamageType.Water: return ElementType.Water;
      case DamageType.Earth: return ElementType.Earth;
      case DamageType.Air: return ElementType.Air;
      case DamageType.Light: return ElementType.Light;
      case DamageType.Dark: return ElementType.Dark;
      default: return ElementType.Normal;
    }
  }
  
  evolve(): boolean {
    // Logique d'évolution basée sur l'expérience et le niveau
    if (this.growthStage === GrowthStage.Juvenile && this.experience >= 1000) {
      this.growthStage = GrowthStage.Adolescent;
      // Améliorer les stats
      this.improveStats(1.2); // Multiplier par 1.2
      return true;
    }
    // Autres évolutions...
    
    return false;
  }
  
  private improveStats(multiplier: number): void {
    this.stats.maxHealth = Math.floor(this.stats.maxHealth * multiplier);
    this.stats.attack = Math.floor(this.stats.attack * multiplier);
    this.stats.defense = Math.floor(this.stats.defense * multiplier);
    this.stats.speed = Math.floor(this.stats.speed * multiplier);
    this.stats.intelligence = Math.floor(this.stats.intelligence * multiplier);
    // Soigner complètement lors de l'évolution
    this.stats.currentHealth = this.stats.maxHealth;
  }
}