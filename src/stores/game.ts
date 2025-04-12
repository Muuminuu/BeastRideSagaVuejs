import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Hero } from '@/core/entities/Hero';
import type { Enemy } from '@/core/entities/Enemy';
import { AnimalSpirit } from '@/core/entities/AnimalSpirit';

export interface WorldPosition {
    x: number;
    y: number;
}

export interface WorldRegion {
    id: string;
    name: string;
    biome: string;
    dangerLevel: number;
    explored: boolean;
    position: WorldPosition;
}

export enum GameTime {
    Morning = 'morning',
    Afternoon = 'afternoon',
    Evening = 'evening',
    Night = 'night',
}

export enum Season {
    Spring = 'spring',
    Summer = 'summer',
    Fall = 'fall',
    Winter = 'winter',
}

export const useGameStore = defineStore('game', () => {
    const player =  ref<Hero | null>(null);

    const worldRegions =  ref<WorldRegion[]>([]);
    const currentRegionId = ref('');
    const currentPosition = ref<WorldPosition>({ x: 0, y: 0 });

    const currentGameTime = ref(GameTime.Morning);
    const currentSeason = ref(Season.Spring);
    const dayCount = ref(1);

    const currentWeather = ref('sunny');
    const weatherEffects = ref({
        sunny: { visibility: 1, speed: 1 },
        rainy: { visibility: 0.8, speed: 0.9 },
        snowy: { visibility: 0.5, speed: 0.7 },
        stormy: { visibility: 0.3, speed: 0.5 },
    });

    const activeQuests = ref<any[]>([]);
    const completedQuests = ref<any[]>([]);

    const gameInitialized = ref(false);

    const currentRegion = computed(() => {
        return worldRegions.value.find(region =>region.id === currentRegionId.value);
    })

    function setPlayer(newPlayer: Hero) {
        player.value = newPlayer;
    }

    function initializeWorld() {
        worldRegions.value = [
            {
              id: 'forest_start',
              name: 'Forêt des Murmures',
              biome: 'forest',
              dangerLevel: 1,
              explored: true,
              position: { x: 0, y: 0 }
            },
            {
              id: 'plains_east',
              name: 'Plaines de l\'Aube',
              biome: 'plains',
              dangerLevel: 1,
              explored: false,
              position: { x: 1, y: 0 }
            },
            {
              id: 'mountains_north',
              name: 'Montagnes Brumeuses',
              biome: 'mountains',
              dangerLevel: 2,
              explored: false,
              position: { x: 0, y: 1 }
            },
            {
              id: 'swamp_south',
              name: 'Marais des Ombres',
              biome: 'swamp',
              dangerLevel: 2,
              explored: false,
              position: { x: 0, y: -1 }
            },
            {
              id: 'beach_west',
              name: 'Côte des Tempêtes',
              biome: 'beach',
              dangerLevel: 1,
              explored: false,
              position: { x: -1, y: 0 }
            }
        ];

        currentRegionId.value = 'forest_start';
        currentPosition.value = { x: 0, y: 0 };

        gameInitialized.value = true;
    }

    function moveToRegion(regionId: string) {
        const region = worldRegions.value.find(r => r.id  === regionId)
        if (region) {
            currentRegionId.value = regionId;
            currentPosition.value = { ...region.position };
            if (!region.explored) {
                region.explored = true;
            }
        }
    }

    function advanceTime() {
        const times = Object.values(GameTime);
        const currentIndex = times.indexOf(currentGameTime.value);
        const nextIndex = (currentIndex +1) % times.length;
        currentGameTime.value = times[nextIndex];

        if (nextIndex ===0) {
            dayCount.value++;

            if (dayCount.value % 30 === 0) {
                const seasons = Object.values(Season);
                const currentSeasonIndex = seasons.indexOf(currentSeason.value);
                currentSeason.value = seasons[(currentSeasonIndex + 1) % seasons.length]
            }
        }
    }

    function getRandomEnemiesForRegion(regionId: string, count: number = 1): Enemy[] {
        // This would normally pull from a database of enemies based on region
        // For now, we'll return a placeholder
        return []
    }

    function saveGame() {
        // save game state to localStorage
        if (player.value) {
            try {
                localStorage.setItem('beast_ride_player', JSON.stringify(player.value));
                localStorage.setItem('beastride_world', JSON.stringify({
                    regions: worldRegions.value,
                    currentRegion: currentRegionId.value,
                    position: currentPosition.value,
                    time: currentGameTime.value,
                    season: currentSeason.value,
                    day:dayCount.value
                }))
                return true;
            } catch (error) {
                console.error('Error saving game:', error);
                return false;
            }
        }
        return false;
    }

    function loadGame(): boolean {
        try {
            const savedPlayer = localStorage.getItem('beast_ride_player');
            const savedWorld = localStorage.getItem('beastride_world');

            if (savedPlayer && savedWorld) {
                const playerData = JSON.parse(savedPlayer)
                const worldData = JSON.parse(savedWorld);

                const hero = new Hero(
                    playerData.id,
                    playerData.name,
                    playerData.stats
                )
            

                if (playerData.soulBond) {
                    const spiritData = playerData.soulBond;
                    const spirit = new AnimalSpirit(
                        spiritData.id,
                        spiritData.name,
                        spiritData.type,
                        spiritData.stats
                    )
                    
                    spirit.abilities = spiritData.abilities
                    spirit.growthStage = spiritData.growthStage;
                    spirit.experience = spiritData.experience;

                    hero.bondWithSpirit(spirit);
                }

                player.value = hero;
                worldRegions.value = worldData.regions;
                currentRegionId.value = worldData.currentRegion;
                currentPosition.value = worldData.position;
                currentGameTime.value = worldData.time;
                currentSeason.value = worldData.season;
                dayCount.value = worldData.day;

                gameInitialized.value = true;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading game:', error);
            return false;
        }
    }

    return {
        // State
        player,
        worldRegions,
        currentRegionId,
        currentPosition,
        currentGameTime,
        currentSeason,
        dayCount,
        currentWeather,
        weatherEffects,
        activeQuests,
        completedQuests,
        gameInitialized,

        // Computed
        currentRegion,

        // Actions
        setPlayer,
        initializeWorld,
        moveToRegion,
        advanceTime,
        getRandomEnemiesForRegion,
        saveGame,
        loadGame
    }
})