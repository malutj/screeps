// TODO:
// Need to rewrite code that goes to find energy. If containers are empty, creeps are standing there waiting.
// If a builder is latched onto an energy node, nobody else can get to it
//  I need harvesters to take energy out to other creeps so they don't get jammed up
// If harvesters don't have anywhere to take energy, they sit (in the way). They need to wait elsewhere for an energy need.
// Transition from harvester to miner is not good. If I have one, occupied container, I'll stop spawning anything else
//   because I see I need more miners and fail to spawn one and never hit the other else cases
// Each role should have it's own constructor method. That method takes the amount of available energy
//   and determines what body parts to add.
// The builder role should prioritize certain buildings.
// Consider having transporters move energy between containers


var minNumberHarvesters = 0;
var minNumberUpgraders = 2;
var minNumberBuilders = 1;
var minNumberAttackers = 0;
var minNumberMiners = 2;
var minNumberSnipers = 4;
var minNumberClaimers = 1;
var minNumberWorkers = 2;

var adjacentRooms = 
{
    NORTH:'E59S6',
    EAST:'E60S7',
    SOUTH:'E59S8',
    SOUTHWEST:'E58S8',
    WEST:'E58S7'
};

var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleAttacker = require('role.attacker');
var roleMiner = require('role.miner');
var roleSniper = require('role.sniper');
var roleClaimer = require ('role.claimer');
var roleWorker = require ('role.worker');

var S_HARVESTER = 'harvester';
var S_UPGRADER = 'upgrader';
var S_BUILDER = 'builder';
var S_ATTACKER = 'attacker';
var S_MINER = 'miner';
var S_SNIPER = 'sniper';
var S_CLAIMER = 'claimer';
var S_WORKER = 'worker';

var lastEnergySource = 0;

module.exports.loop = function () 
{
    function DeleteOldMemory ( )
    {
        for(var name in Memory.creeps) 
        {
            if(!Game.creeps[name]) 
            {
                delete Memory.creeps[name];
            }
        } 
    }
    
    
    function RunCreepRoles ( )
    {
        for(var name in Game.creeps) 
        {
            var creep = Game.creeps[name];
            if ( creep.memory.role == S_HARVESTER )
            {
                roleHarvester.run(creep);
            }
            else if ( creep.memory.role == S_UPGRADER )
            {
                roleUpgrader.run(creep);
            }
            else if ( creep.memory.role == S_BUILDER )
            {
                roleBuilder.run(creep);
            }
            else if ( creep.memory.role == S_ATTACKER )
            {
                roleAttacker.run(creep);
            }
            else if ( creep.memory.role == S_SNIPER )
            {
                roleSniper.run(creep);
            }
            else if ( creep.memory.role == S_MINER )
            {
                roleMiner.run(creep);
            }
            else if ( creep.memory.role == S_CLAIMER )
            {
                roleClaimer.run(creep);
            }
            else if ( creep.memory.role == S_WORKER)
            {
                roleWorker.run ( creep );
            }
        }
    }
    
       
    function SpawnNewCreepIfNeeded ( )
    {
        // jmm: this can be optimized at some point
        var currentHarvesters = _.sum(Game.creeps, (c)=>c.memory.role == S_HARVESTER);
        var currentUpgraders = _.sum(Game.creeps, (c)=>c.memory.role == S_UPGRADER);
        var currentBuilders = _.sum(Game.creeps, (c)=>c.memory.role == S_BUILDER);
        var currentAttackers = _.sum(Game.creeps, (c)=>c.memory.role == S_ATTACKER);
        var currentMiners = _.sum(Game.creeps, (c)=>c.memory.role == S_MINER);
        var currentSnipers = _.sum(Game.creeps, (c)=>c.memory.role == S_SNIPER );     
        var currentClaimers = _.sum(Game.creeps, (c)=>c.memory.role == S_CLAIMER);
        var currentWorkers = _.sum(Game.creeps, (c)=>c.memory.role == S_WORKER);
    
        for(var name in Game.creeps) 
        {
            var creep = Game.creeps[name];
            var role = creep.memory.role;
    
            if ( role != S_HARVESTER && role != S_BUILDER && role != S_UPGRADER && role != S_ATTACKER && role != S_MINER && role != S_SNIPER && role != S_CLAIMER && role != 'worker')
            {
                console.log ( creep.name, 'has an unknown role:', role);
            }
        }
        
        console.log('W:'+ currentWorkers+' | H:'+ currentHarvesters + ' | U:'+ currentUpgraders + ' | B:' + currentBuilders + ' | S:' + currentSnipers + ' | M:' + currentMiners );
        
        var spawn1 = Game.spawns['Base'];
        var readyForMiners = spawn1.room.find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_CONTAINER } } ).length;

        
    
        if ( spawn1.spawning )
        {
            spawn1.room.visual.text(spawn1.spawning.name, spawn1.pos.x + 1, spawn1.pos.y, {align: 'left', opacity: 0.8});
        }
        else if ( currentWorkers < minNumberWorkers )
        {
            roleWorker.spawn ( spawn1 );
        }
        else if ( currentHarvesters < minNumberHarvesters )
        {        
            roleHarvester.spawn ( spawn1 );        
        }
        else if ( readyForMiners && currentMiners < minNumberMiners )
        {
           roleMiner.spawn ( spawn1 ); 
        }
        else if ( currentUpgraders < minNumberUpgraders )
        {
            roleUpgrader.spawn ( spawn1 );
        }
        else if ( currentBuilders < minNumberBuilders )
        {
            roleBuilder.spawn ( spawn1, spawn1.room );
        }
        else if ( currentAttackers < minNumberAttackers )
        {
            spawn1.createCreep([ATTACK,MOVE], S_ATTACKER+Game.time.toString(), {role:S_ATTACKER, status:'idle'});
        }
        else if ( currentSnipers < minNumberSnipers )
        {
            roleSniper.spawn ( spawn1 );
        }
        else if ( currentClaimers < minNumberClaimers )
        {
            roleClaimer.spawn ( spawn1 );
        }
    }
    
    
    DeleteOldMemory ( );
    
    RunCreepRoles ( );
    
    SpawnNewCreepIfNeeded ( );
    

    var hostiles = Game.spawns['Base'].room.find(FIND_HOSTILE_CREEPS);
    if(hostiles.length > 0) {
        var username = hostiles[0].owner.username;
        Game.notify('Hostile in room');
        var towers = Game.spawns['Base'].room.find( FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.forEach(tower => tower.attack(hostiles[0]));
    }
    else if ( Game.spawns['Base'].room.storage.store[ RESOURCE_ENERGY ] > 10000 )
    {
        var repairs = Game.spawns['Base'].room.find(FIND_STRUCTURES, { filter: (site) => site.hits < site.hitsMax  && site.structureType != STRUCTURE_WALL } );
        if ( repairs.length )
        {
            var towers = Game.spawns['Base'].room.find( FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
            towers.forEach(tower => tower.repair(repairs[0]));
        }
    }
    
}