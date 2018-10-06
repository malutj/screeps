var roleBuilder = {
    
    spawn: function ( spawnPoint, targetRoomName,  )
    {
        var body;
        var energyAmount = spawnPoint.room.energyCapacityAvailable;

        if ( energyAmount == 300 )
        {
            body = [WORK, WORK, CARRY, MOVE];
        }
        else if ( energyAmount == 350 )
        {
            body = [WORK, WORK, CARRY, MOVE, MOVE];
        }
        else if ( energyAmount == 400 )
        {
            body = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        else if ( energyAmount == 450 )
        {
            body = [WORK, WORK, WORK, CARRY, CARRY, MOVE];
        }
        else if ( energyAmount == 500 )
        {
            body = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        else if ( energyAmount == 550 )
        {
            body = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 600 )
        {
            body = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 650 )
        {
            body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
        }
        else if ( energyAmount == 700 )
        {
            body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
        }
        else if ( energyAmount == 750 )
        {
            body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount >= 800 )
        {
            body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        spawnPoint.createCreep ( body, 'builder'+Game.time.toString(), { role:'builder', status:'harvesting', energySource: 0, targetRoom: targetRoomName } );
    },
    
    /** @param {Creep} creep **/
    run: function(creep) 
    {
        if(creep.memory.status == 'building' && creep.carry.energy == 0) 
        {
            creep.memory.status = 'harvesting';
        }
        else if( creep.memory.status != 'building' && creep.carry.energy == creep.carryCapacity) 
        {
            creep.memory.status = 'building';
        }


        if(creep.memory.status == 'building') 
        {
            var buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
            
            if(buildTargets.length) 
            {
                buildTargets = _.sortBy(buildTargets, s => creep.pos.getRangeTo(s));
                if(creep.build(buildTargets[0]) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(buildTargets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else
            {
                if ( creep.room.name != creep.memory.targetRoom )
                {
                    const exitDir = creep.room.findExitTo(creep.memory.targetRoom);
                    const exit = creep.pos.findClosestByRange(exitDir);
                    creep.moveTo(exit, { visualizePathStyle: {stroke: '#ffffff'} });
                    return;
                }

                var repairTargets = creep.room.find(FIND_STRUCTURES, { filter:  (site) => site.hits < site.hitsMax && site.structureType != STRUCTURE_WALL && site.structureType != STRUCTURE_RAMPART} );
                
                if(repairTargets.length) 
                {
                    var repairing = false;
                    for (var r in repairTargets)
                    {
                        if ( repairTargets[r].structureType == STRUCTURE_RAMPART && repairTargets[r].hits < (repairTargets[r].hitsMax/2) )
                        {
                            repairing = true;
                            if(creep.repair(repairTargets[r]) == ERR_NOT_IN_RANGE) 
                            {
                                creep.moveTo(repairTargets[r].pos, {visualizePathStyle: {stroke: '#ffaa00'}});
                                break;
                            }
                        }
                    }

                    if( ! repairing && creep.repair(repairTargets[0]) == ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(repairTargets[0].pos, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }                
            }
        }
        else 
        {

            // FIRST SEE IF WE HAVE A STORAGE UNIT IN THE ROOM
            if ( Game.spawns['Base'].room.storage )
            {
                if ( creep.withdraw( Game.spawns['Base'].room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo(Game.spawns['Base'].room.storage, {visualizePathStyle: {stroke: '#ffffff'}});
                    return;
                }
            }            

            var containers = creep.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});

            if ( containers.length )
            {
                containers = _.sortBy(containers, c => c.store[RESOURCE_ENERGY]);
                var c = containers[containers.length-1];

                if ( creep.withdraw( c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo(c, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else
            {
                var sources = creep.room.find(FIND_SOURCES);
                var energySource = creep.memory.energySource;
                
                if(creep.harvest(sources[energySource]) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(sources[energySource], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};

module.exports = roleBuilder;