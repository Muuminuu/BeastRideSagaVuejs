import { Character } from './Character';
import { Stats } from '../types/Stats';
import { AnimalSpirit } from './AnimalSpirit';

export class Hero extends Character {
    soulBond: AnimalSpirit | null;

    constructor(id: string, name:string, stats: Stats) {
        super(id, name, stats);
        this.soulBond = null;
    }

    bondWithSpirit(spirit: Animalspirit): void {
        this.soulBond = spirit;
    }

    unboundSpirit(): AnimalSpirit | null {
        const previousBond = this.soulBond;
        this.soulBond = null;
        return previousBond;
    }
}