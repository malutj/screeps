var roleHarvester = {

    spawn: function ( spawnPoint )
    {
        var body;
        var energyAmount = spawnPoint.room.energyCapacityAvailable;

        if ( energyAmount == 300 )
        {
            body = [WORK, CARRY, CARRY, MOVE, MOVE ];
        }
        else if ( energyAmount == 350 )
        {
            body = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 400 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 450 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 500 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 550 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 600 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 650 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 700 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount == 750 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }
        else if ( energyAmount >= 800 )
        {
            body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }

        spawnPoint.createCreep ( body, 'harvester'+Game.time.toString(), { role:'harvester' } );
    },

    /** @param {Creep} creep **/
    run: function(creep) 
    {
        if(creep.carry.energy == 0) 
        {
            // CREATE AN ARRAY OF POTENTIAL ENERGY SOURCES IN ORDER OF PRIORITY
            // 1. DROPPED ENERGY
            // 2. CONTAINERS
            // 3. ENERGY NODES

            var droppedEnergy =  creep.pos.findClosestByRange ( FIND_DROPPED_RESOURCES );
            if ( droppedEnergy )
            {
                if ( creep.pickup ( droppedEnergy ) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo ( droppedEnergy, {visualizePathStyle: {stroke: '#ffffff'}} );
                    return;
                }
            }

            var container = _.sortBy ( creep.room.find ( FIND_STRUCTURES, { filter : function(s) { return ( s.structureType == STRUCTURE_CONTAINER && s.store[ RESOURCE_ENERGY ] > 0 ) } } ), (s) => s.store[ RESOURCE_ENERGY ] );
        
            if ( container.length )
            {
                if ( creep.withdraw ( container[ container.length - 1 ], RESOURCE_ENERGY ) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo ( container[ container.length - 1 ], {visualizePathStyle: {stroke: '#ffffff'}} );
                    return;
                } 
            }

            // IF WE HAVE AT LEAST ONE 'WORK' BODY PART, WE CAN TRY TO SOURCE ENERGY FROM A NODE
            var canWork = false;
            for ( var part in creep.body )
            {
                if ( creep.body[ part ].type == WORK )
                {
                    canWork = true;
                    break;
                }
            }

            if ( canWork )
            {
                var energyNode = creep.pos.findClosestByRange ( FIND_SOURCES_ACTIVE );
                if ( energyNode && creep.harvest ( energyNode ) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo ( energyNode, {visualizePathStyle: {stroke: '#ffffff'}} );
                }
            }
        }
        else 
        {
            // CREATE AN ARRAY OF POTENTIAL ENERGY DUMPS IN ORDER OF PRIORITY
            // 1. SPAWN POINT
            // 2. EXTENSIONS
            // 3. TOWERS
            // 4. STORAGE

            var moving = false;

            var energyDumps =  _.sortBy ( creep.room.find ( FIND_STRUCTURES, { filter : { structureType: STRUCTURE_SPAWN     } } ), (s) => creep.pos.getRangeTo ( s ) );
            energyDumps = energyDumps.concat ( _.sortBy ( creep.room.find ( FIND_STRUCTURES, { filter : { structureType: STRUCTURE_EXTENSION } } ), (s) => creep.pos.getRangeTo ( s ) ) );
            energyDumps = energyDumps.concat ( _.sortBy ( creep.room.find ( FIND_STRUCTURES, { filter : { structureType: STRUCTURE_TOWER     } } ), (s) => creep.pos.getRangeTo ( s ) ) ); 

            for ( var d = 0; d < energyDumps.length; d++ )
            {
                if ( energyDumps[ d ].energy < energyDumps[ d ].energyCapacity )
                {
                    if ( creep.transfer ( energyDumps[ d ], RESOURCE_ENERGY ) == ERR_NOT_IN_RANGE )
                    {
                        creep.moveTo  (energyDumps[ d ], {visualizePathStyle: {stroke: '#FFE56D', opacity: 0.6}} );
                        moving = true;
                        break;
                    }
                }
                if ( ! moving )
                {
                    if ( creep.room.storage.store[RESOURCE_ENERGY] < creep.room.storage.storeCapacity )
                    {
                        if ( creep.transfer ( creep.room.storage, RESOURCE_ENERGY ) == ERR_NOT_IN_RANGE )
                        {
                            creep.moveTo( creep.room.storage, {visualizePathStyle: {stroke: '#FFE56D', opacity: 0.6}} );
                            moving = true;
                        }
                    }
                }
            }
            
            if ( moving == false )
            {
                creep.moveTo(Game.spawns['Base'], {visualizePathStyle: {stroke: '#FFE56D', opacity: 0.6}});
            }
        }
    }
};

module.exports = roleHarvester;