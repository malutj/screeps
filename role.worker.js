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
        /*
            STATES
            GATHERING ENERGY
                IF an existing target exists
                    IF target still has energy
                        IF in range
                            harvest/withdraw
                        ELSE
                            move to target
                    ELSE
                        find new target
                        
            TRANSFERRING ENERGY

            When do I stop gathering?
                When I'm full
                When I'm half-full and no single source can fill me up the rest of the way

            When do I stop transferring?
                When I have no remaining energy
                When there is nowhere to place energy and I have less than half of my energy left
                

            How do I keep from pulling from storage only to put back into storage?
                pull from containers first
                When a container is full and I am full, only then start dumping into container
            
            

            Transfer priority
                Spawn
                Extensions
                Towers
                Builders ( < 50% ) 
                Upgraders ( < 50% ) 
                Storage ( only if a container is more than 50% full )
                
        */

        // Resource.amount
        // StructureContainer.store[RESOURCE_ENERGY]
        // StructureStorage.store[RESOURCE_ENERGY]

        const STATE = { GATHERING:0, TRANSFERRING:1 };
        const STATE_MACHINE = [ Gather, Transfer ];

        const WORKER = 'worker';
        
        // IGNORE DROPPED RESOURCES UNLESS THE AMOUNT TO BE HARVESTED IS AT LEAST
        // THIS PERCENTAGE OF OUR TOTAL CARRY CAPACITY
        const MIN_DROPPED_RESOURCE_PCT = .25;

        // IF WE'RE CURRENTLY GATHERING AND THERE ARE NO SOURCES, WE
        // WILL BEGIN TO TRANSFER THAT ENERGY IF WE HAVE AT LEAST
        // THIS PERCENTAGE OF OUR TOTAL CARRY CAPACITY.
        const MIN_CURRENT_ENERGY_PCT_TO_TRANSFER = .50;

        // IF WE'RE CURRENTLY TRANSFERRING AND THERE ARE NO TARGETS, WE
        // WILL BEGIN TO GATHER MORE ENERGY IF WE HAVE LESS THAN 
        // THIS PERCENTAGE OF OUR TOTAL CARRY CAPACITY.
        const MAX_CURRENT_ENERGY_PCT_TO_GATHER = .50;


        
        function TargetCanUseAnotherGatherer ( target )
        {
            var workersInThisRoom = _.filter ( Game.creeps, function ( c ) { c.room === creep.room && c.role == WORKER && c.currentState == STATE.GATHERING } );
            var remainingEnergy = ( target instanceof Resource ) ? target.amount : target.store[ RESOURCE_ENERGY ];
            var claimedEnergy = 0;

            for ( var i = 0; i < workersInThisRoom.length; ++i )
            {
                if ( workersInThisRoom[ i ].memory.currentTargetId == target.id )
                {
                    claimedEnergy += ( workersInThisRoom[ i ].carryCapacity - _.sum( workersInThisRoom[ i ].carry ) );
                }
            }

            return  ( remainingEnergy - claimedEnergy >= creep.carryCapacity * MIN_DROPPED_RESOURCE_PCT );
        }


        function TargetCanUseAnotherTransporter ( target )
        {
            var workersInThisRoom = _.filter ( Game.creeps, function ( c ) { c.room === creep.room && c.role == WORKER && c.currentState == STATE.TRANSFERRING } );
            var neededEnergy = ( target instanceof StructureStorage ) ? target.storeCapacity - target.store[ RESOURCE_ENERGY ] : target.energyCapacity - target.energy;
            var promisedEnergy = 0;

            for ( var i = 0; i < workersInThisRoom.length; ++i )
            {
                if ( workersInThisRoom[ i ].memory.target == target )
                {
                    promisedEnergy += ( workersInThisRoom[ i ].carryCapacity - workersInThisRoom[ i ].carry[ RESOURCE_ENERGY ] );
                }
            }

            return ( neededEnergy > promisedEnergy )
        }


        function CheckDroppedResources ( )
        {
            var droppedResources =  _sortBy ( creep.room.find ( FIND_DROPPED_RESOURCES ), ( d ) => creep.pos.getRangeTo ( d ) );

            if ( droppedResources.length )
            {
                for ( var i = 0; i < droppedResources.length; ++i )
                {
                    if ( TargetCanUseAnotherGatherer ( droppedResources[ i ] ) )
                    {
                        return droppedResources[ i ];
                    }
                }
            }
        }


        function CheckContainers ( )
        {
            var containers =  _sortBy ( creep.room.find ( FIND_STRUCTURES, function ( c ){ c.structureType == STRUCTURE_CONTAINER && c.store[RESOURCE_ENERGY] > 0 } ), ( d ) => creep.pos.getRangeTo ( d ) );

            if ( containers.length )
            {
                for ( var i = 0; i < containers.length; ++i )
                {
                    if ( TargetCanUseAnotherGatherer ( containers[ i ] ) )
                    {
                        return containers[ i ];
                    }
                }
            } 
        }


        function CheckStorageForGathering ( )
        {
            if ( creep.room.storage && TargetCanUseAnotherGatherer ( creep.room.storage ) )
            {
                return creep.room.storage;
            }
        }


        function CheckEnergyNodes ( )
        {
            if ( creep.getActiveBodyparts ( WORK ) )
            {
                var energyNodes = _sortBy ( creep.room.find ( FIND_ACTIVE_SOURCES ), (n) => creep.pos.getRangeTo ( n ) );
                if ( energyNodes.length )
                {
                    return energyNodes[ 0 ];
                }
            }
        }


        function GetEnergyTarget ( currentTarget )
        {
            if ( currentTarget != null && TargetCanUseAnotherGatherer ( currentTarget ) )
            {
                return currentTarget;
            }

            // WE NEED A NEW ENERGY SOURCE. USE THE FOLLOWING PRIORITY LIST
            // 1. DROPPED ENERGY
            // 2. CONTAINERS
            // 3. STORAGE
            // 4. ENERGY NODES
            var energyTarget = CheckDroppedResources ( );

            if ( energyTarget ) return energyTarget;

            energyTarget = CheckContainers ( );

            if ( energyTarget ) return energyTarget;

            energyTarget = CheckStorageForGathering ( );

            if ( energyTarget ) return energyTarget;

            energyTarget = CheckEnergyNodes ( );

            return energyTarget;
        }


        function Gather ( )
        {                        
            // IF WE'RE ALREADY FULL OF ENERGY, START THE TRANSFER
            if ( _sum ( creep.carry ) == creep.carryCapacity )
            {
                creep.memory.currentTargetId = null;
                return Transfer ( );
            }

            var target = GetEnergyTarget ( Game.getObjectById ( creep.memory.currentTargetId ) );

            if ( target == null )
            {
                // THERE ARE NO GATHER TARGETS AT PRESENT. 
                if ( _.sum ( creep.carry ) >= creep.carryCapacity * MIN_CURRENT_ENERGY_PCT_TO_TRANSFER )
                {
                    // WE HAVE AN ACCEPTABLE AMOUNT OF ENERGY TO GO AHEAD AND TRANSFER
                    creep.memory.currentTargetId = null;
                    return Transfer ( );
                }
            }
            else
            {
                creep.memory.currentTargetId = target.id;

                var result;
                if ( target instanceof Resource )
                {
                    result = creep.pickup ( target );
                }
                else
                {
                    result = creep.withdraw ( target, RESOURCE_ENERGY );
                }

                if ( result == ERR_NOT_IN_RANGE )
                {
                    result = creep.moveTo ( target, { visualizePathStyle: { stroke: '#ffffff' } } );
                    if ( result < 0 )
                    {
                        console.log ( 'Error', result, 'returned on attempt to move' );
                    }
                }
                else if ( result < 0)
                {
                    console.log ( 'Error', result, ' returned when attempting to obtain energy from', target );
                }
            }

            return STATE.GATHERING;
        }


        function CheckSpawns ( )
        {
            var spawns = _.sortBy ( creep.room.find ( FIND_STRUCTURES, function ( s ){ s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity }  ), (s) => creep.pos.getRangeTo ( s ) );

            if ( spawns.length )
            {
                for ( var i = 0; i < spawns.length; ++i )
                {
                    if ( TargetCanUseAnotherTransporter ( spawns[ i ] ) )
                    {
                        return spawns[ i ];
                    }
                }
            }
        }


        function CheckExtensions ( )
        {
            var extensions = _.sortBy ( creep.room.find ( FIND_STRUCTURES, function ( s ){ s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity }  ), (s) => creep.pos.getRangeTo ( s ) );

            if ( extensions.length )
            {
                for ( var i = 0; i < extensions.length; ++i )
                {
                    if ( TargetCanUseAnotherTransporter ( extensions[ i ] ) )
                    {
                        return extensions[ i ];
                    }
                }
            }
        }


        function CheckTowers ( )
        {
            var towers = _.sortBy ( creep.room.find ( FIND_STRUCTURES, function ( s ){ s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity }  ), (s) => creep.pos.getRangeTo ( s ) );

            if ( towers.length )
            {
                for ( var i = 0; i < towers.length; ++i )
                {
                    if ( TargetCanUseAnotherTransporter ( towers[ i ] ) )
                    {
                        return towers[ i ];
                    }
                }
            }
        }


        function CheckStorageForTransporting ( )
        {
            if ( creep.room.storage && TargetCanUseAnotherTransporter ( creep.room.storage ) )
            {
                return creep.room.storage;
            } 
        }


        function GetTransferTarget ( currentTarget )
        {
            if ( currentTarget != null && TargetCanUseAnotherTransporter ( currentTarget ) )
            {
                return currentTarget;
            }

            // WE NEED A NEW TRANSFER TARGET. USE THE FOLLOWING PRIORITY LIST
            // 1. SPAWNS
            // 2. EXTENSIONS
            // 3. TOWERS
            // 4. STORAGE

            var transferTarget = CheckSpawns ( );

            if ( transferTarget ) return transferTaret;

            transferTarget = CheckExtensions ( );

            if ( transferTarget ) return transferTarget;

            transferTarget = CheckTowers ( );

            if ( transferTarget ) return transferTarget;

            transferTaret = CheckStorageForTransporting ( );

            return transferTarget;            
        }




        function Transfer ( )
        {
            if ( creep.carry.energy == 0 )
            {
                creep.memory.currentTargetId = null;
                return Gather ( );
            }

            var target = GetTransferTarget ( Game.getObjectById ( creep.memory.currentTargetId ) );

            if ( target == null )
            {
                if ( creep.carry.energy < creep.carryCapacity * MIN_CURRENT_ENERGY_PCT_TO_TRANSFER )
                {
                    return Gather ( );
                }
            }
            else
            {
                creep.memory.currentTargetId = target.id;

                var result;

                if ( target instanceof StructureStorage )
                {
                    result = transfer ( )
                }

                if ( result == ERR_NOT_IN_RANGE )
                {
                    result = creep.moveTo ( target, { visualizePathStyle: { stroke: '#ffffff' } } );
                    if ( result < 0 )
                    {
                        console.log ( 'Error', result, 'returned on attempt to move' );
                    }
                }
                else if ( result < 0)
                {
                    console.log ( 'Error', result, ' returned when attempting to obtain energy from', target );
                }
            }

            return STATE.TRANSFERRING;
        }


        function ValidateCurrentState ( currentState )
        {
            if ( currentState == undefined || currentState == null ) return STATE.GATHERING;
            
            return currentState;
        }

        
        // MAIN CODE 
        var currentState = ValidateCurrentState ( creep.memory.currentState );

        creep.memory.currentState = STATE_MACHINE[ currentState ] ( );
        


        else 
        {
            // CREATE AN ARRAY OF POTENTIAL ENERGY DUMPS IN ORDER OF PRIORITY
            // 1. SPAWN POINT
            // 2. EXTENSIONS
            // 3. TOWERS
            // 4. STORAGE

            var moving = false;

            
            
            if ( moving == false )
            {
                creep.moveTo(Game.spawns['Base'], {visualizePathStyle: {stroke: '#FFE56D', opacity: 0.6}});
            }
        }
    }
};

module.exports = roleHarvester;