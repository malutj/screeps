var roleUpgrader = {
    
    spawn: function ( spawnPoint )
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
        else if ( energyAmount >= 800 )//&& energyAmount < 1000 )
        {
            body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount >= 1000)
        {
            body = [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        }

        spawnPoint.createCreep ( body, 'upgrader'+Game.time.toString(), { role:'upgrader', status:'harvesting', energySource: 0 } );
    },
    
    /** @param {Creep} creep **/
    run: function(creep)
    {
        if(creep.memory.status == 'upgrading' && creep.carry.energy == 0) 
        {
            creep.memory.status = 'harvesting';
            creep.say('🔄 harvest');
        }
        else if(creep.memory.status != 'upgrading' && creep.carry.energy == creep.carryCapacity) 
        {
            creep.memory.status = 'upgrading';
            creep.say('⚡ upgrade');
        }

        if(creep.memory.status == 'upgrading') 
        {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else 
        {
            // FIRST SEE IF WE HAVE A STORAGE UNIT IN THE ROOM
            if ( creep.room.storage )
            {
                if ( creep.withdraw( creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffffff'}});
                    return;
                }
            }

            var containers = creep.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});

            if ( containers.length )
            {
                containers = _.sortBy(containers, c => c.store[RESOURCE_ENERGY]);      
                var c = containers[containers.length-1];

                if ( creep.withdraw(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo(c);
                }
            }
            else
            {
                var sources = creep.room.find(FIND_SOURCES);
                var energySource = creep.memory.energySource;
                if(creep.harvest(sources[energySource]) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(sources[energySource], {visualizePathStyle: {stroke: '#ffaa00'}});
                }
                else
                {
                    console.log('1');
                }
            }
        }
    }
};

module.exports = roleUpgrader;