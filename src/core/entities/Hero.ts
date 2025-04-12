import { Character } from './Character';
import type { Stats } from '../types/Stats';
import { AnimalSpirit } from './AnimalSpirit';

export class Hero extends Character {
    soulBond: AnimalSpirit | null;

    constructor(id: string, name:string, stats: Stats) {
        super(id, name, stats);
        this.soulBond = null;
    }

    bondWithSpirit(spirit: AnimalSpirit): void {
        this.soulBond = spirit;
    }

    unboundSpirit(): AnimalSpirit | null {
        const previousBond = this.soulBond;
        this.soulBond = null;
        return previousBond;
    }
}