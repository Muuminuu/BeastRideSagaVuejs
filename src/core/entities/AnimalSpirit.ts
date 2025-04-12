import { Entity } from './Entity';
import { Combatant } from './Combatant';
import { Stats } from '../types/Stats';
import { Ability } from '../types/Ability';
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
  
  takeDamage(amount: number, type: ElementType): void {
    // Calcul des dégâts avec prise en compte des efficacités
    const effectiveness = TypeEffectiveness[type][this.elementType];
    const adjustedDamage = Math.floor(amount * effectiveness);
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - adjustedDamage);
    
    return {
      damage: adjustedDamage,
      effectiveness: effectiveness
    };
  }
  
  useAbility(ability: Ability, target: Combatant): void {
    if (ability.currentCooldown > 0) return;
    
    // Calcul des dégâts basé sur l'attaque et la puissance de la capacité
    const baseDamage = Math.floor(ability.power * (this.stats.attack / 100));
    
    // Appliquer les dégâts à la cible
    const result = target.takeDamage(baseDamage, ability.elementType);
    
    // Mettre la capacité en cooldown
    ability.currentCooldown = ability.cooldown;
    
    return result;
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