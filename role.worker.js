var roleWorker = {

    spawn: function ( spawnPoint )
    {
        var body;
        //var energyAmount = spawnPoint.room.energyCapacityAvailable;

        // if ( energyAmount == 300 )
        // {
        //     body = [WORK, CARRY, CARRY, MOVE, MOVE ];
        // }
        // else if ( energyAmount == 350 )
        // {
        //     body = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 400 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 450 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 500 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 550 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 600 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 650 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 700 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount == 750 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        // }
        // else if ( energyAmount >= 800 )
        // {
        //     body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        // }

        body = [ CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE ];

        spawnPoint.createCreep ( body, 'worker' + Game.time.toString ( ), { role: 'worker', homeRoomId: spawnPoint.room.id, currentState: 0 } );
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

        // MINIMUM AMOUNT OF ENERGY A CONTAINER MUST HAVE
        // IN ORDER FOR US TO GATHER FROM IT
        const MIN_CONTAINER_ENERGY_TO_GATHER = 50;

        


        
        function TargetCanUseAnotherGatherer ( target )
        {
            var workersInThisRoom = _.filter ( Game.creeps, function ( c ) { return c.room == homeRoom && c.memory.role == WORKER && c.memory.currentState == STATE.GATHERING && c.id != creep.id } );
            var remainingEnergy = ( target instanceof Resource ) ? target.amount : target.store[ RESOURCE_ENERGY ];
            var claimedEnergy = 0;

            if ( remainingEnergy == 0) return false;

            for ( var i = 0; i < workersInThisRoom.length; ++i )
            {
                if ( workersInThisRoom[ i ].memory.currentTargetId == target.id )
                {
                    claimedEnergy += ( workersInThisRoom[ i ].carryCapacity - _.sum( workersInThisRoom[ i ].carry ) );
                }
            }

            //console.log ( creep.name+':', target, 'has', remainingEnergy, ' : claimed', claimedEnergy);

            return  ( remainingEnergy - claimedEnergy >= creep.carryCapacity * MIN_DROPPED_RESOURCE_PCT );
        }


        function TargetCanUseAnotherTransporter ( target )
        {
            var workersInThisRoom = _.filter ( Game.creeps, function ( c ) { return  c.room === homeRoom && c.memory.role == WORKER && c.memory.currentState == STATE.TRANSFERRING && c.id != creep.id } );
            var neededEnergy = ( target instanceof StructureStorage ) ? target.storeCapacity - _.sum ( target.store ) : target.energyCapacity - target.energy;
            var promisedEnergy = 0;

            for ( var i = 0; i < workersInThisRoom.length; ++i )
            {
                if ( workersInThisRoom[ i ].memory.currentTargetId == target.id )
                {
                    promisedEnergy += ( target instanceof StructureStorage ) ? _.sum ( workersInThisRoom[ i ].carry ) : workersInThisRoom[ i ].carry[ RESOURCE_ENERGY ];
                }
            }

            //console.log ( creep.name+':', target, 'needs', neededEnergy, ' : promised', promisedEnergy);

            return ( neededEnergy > promisedEnergy )
        }


        function CheckDroppedResources ( )
        {
            var droppedResources =  _.sortBy ( homeRoom.find ( FIND_DROPPED_RESOURCES ), ( d ) => creep.pos.getRangeTo ( d ) );

            if ( droppedResources.length )
            {
                for ( var i = 0; i < droppedResources.length; ++i )
                {
                    if ( TargetCanUseAnotherGatherer ( droppedResources[ i ] ) )
                    {
                        //console.log (creep.name+':', 'found a dropped resource target');
                        return droppedResources[ i ];
                    }
                }
            }
        }


        function CheckContainers ( )
        {
            var containers =  _.sortBy ( homeRoom.find ( FIND_STRUCTURES, { filter: function ( c ){ return c.structureType == STRUCTURE_CONTAINER && c.store[RESOURCE_ENERGY] >= MIN_CONTAINER_ENERGY_TO_GATHER } } ), ( c ) => creep.pos.getRangeTo ( c ) );

            if ( containers.length )
            {
                for ( var i = 0; i < containers.length; ++i )
                {
                    if ( TargetCanUseAnotherGatherer ( containers[ i ] ) )
                    {
                        //console.log (creep.name+':', 'found a container target');
                        return containers[ i ];
                    }
                }
            } 
        }


        function CheckStorageForGathering ( )
        {
            if ( homeRoom.storage && TargetCanUseAnotherGatherer ( homeRoom.storage ) )
            {
                //console.log (creep.name+':', 'found a storage target for gathering');
                return homeRoom.storage;
            }
        }


        function CheckEnergyNodes ( )
        {
            if ( creep.getActiveBodyparts ( WORK ) )
            {
                var energyNodes = _.sortBy ( homeRoom.find ( FIND_ACTIVE_SOURCES ), (n) => creep.pos.getRangeTo ( n ) );
                if ( energyNodes.length )
                {
                    //console.log (creep.name+':', 'found an energy node target');
                    return energyNodes[ 0 ];
                }
            }
        }


        function GetEnergyTarget ( currentTarget )
        {
            if ( currentTarget != null && TargetCanUseAnotherGatherer ( currentTarget ) )
            {
                //console.log (creep.name+':',  'current gather target is still good');
                return currentTarget;
            }

            //if ( currentTarget != null ) console.log (creep.name+':',  'gather target',currentTarget, 'no longer good. finding a new one');
            // WE NEED A NEW ENERGY SOURCE. USE THE FOLLOWINGPRIORITY LIST
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
            if ( _.sum ( creep.carry ) == creep.carryCapacity )
            {
                //console.log (creep.name+':',  'creep is full. Transitioning to TRANSFERRING');
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
                    result = creep.moveTo ( target, { visualizePathStyle: { stroke: '#ff0000', opacity: .8 } } );
                    if ( result < 0 )
                    {
                        console.log (creep.name+':',  'Error', result, 'returned on attempt to move' );
                    }
                }
                else if ( result != ERR_BUSY && result < 0)
                {
                    console.log (creep.name+':',  'Error', result, ' returned when attempting to obtain energy from', target );
                }
            }

            return STATE.GATHERING;
        }


        function CheckSpawns ( )
        {
            var spawns = _.sortBy ( homeRoom.find ( FIND_STRUCTURES, { filter: function ( s ){ return s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity } } ), (s) => creep.pos.getRangeTo ( s ) );

            if ( spawns.length )
            {
                for ( var i = 0; i < spawns.length; ++i )
                {
                    if ( TargetCanUseAnotherTransporter ( spawns[ i ] ) )
                    {
                        //console.log (creep.name+':', 'found a spawn target');
                        return spawns[ i ];
                    }
                }
            }
        }


        function CheckExtensions ( )
        {
            var extensions = _.sortBy ( homeRoom.find ( FIND_STRUCTURES, { filter: function ( s ){ return s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity } }  ), (s) => creep.pos.getRangeTo ( s ) );

            if ( extensions.length )
            {
                for ( var i = 0; i < extensions.length; ++i )
                {
                    if ( TargetCanUseAnotherTransporter ( extensions[ i ] ) )
                    {
                        //console.log (creep.name+':', 'found an extension target');
                        return extensions[ i ];
                    }
                }
            }
        }


        function CheckTowers ( )
        {
            var towers = _.sortBy ( homeRoom.find ( FIND_STRUCTURES, { filter: function ( s ){ return s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity } } ), (s) => creep.pos.getRangeTo ( s ) );

            if ( towers.length )
            {
                for ( var i = 0; i < towers.length; ++i )
                {
                    if ( TargetCanUseAnotherTransporter ( towers[ i ] ) )
                    {
                        //console.log (creep.name+':', 'found a tower target');
                        return towers[ i ];
                    }
                }
            }
        }


        function CheckStorageForTransporting ( )
        {
            if ( homeRoom.storage && TargetCanUseAnotherTransporter ( homeRoom.storage ) )
            {
                //console.log (creep.name+':', 'found a storage target for transporting', homeRoom.storage );
                return homeRoom.storage;
            } 
        }


        function GetTransferTarget ( currentTarget )
        {
            if ( currentTarget != null && TargetCanUseAnotherTransporter ( currentTarget ) )
            {
                //console.log (creep.name+':',  'current transfer target still good');
                return currentTarget;
            }

            //if ( currentTarget != null ) console.log (creep.name+':',  'current transfer target',currentTarget,'no good. finding a new one');

            // WE NEED A NEW TRANSFER TARGET. USE THE FOLLOWING PRIORITY LIST
            // 1. SPAWNS
            // 2. EXTENSIONS
            // 3. TOWERS
            // 4. STORAGE

            var transferTarget = CheckSpawns ( );

            if ( transferTarget ) return transferTarget;

            transferTarget = CheckExtensions ( );

            if ( transferTarget ) return transferTarget;

            transferTarget = CheckTowers ( );

            if ( transferTarget ) return transferTarget;

            transferTarget = CheckStorageForTransporting ( );

            return transferTarget;            
        }


        function Transfer ( )
        {
            if ( _.sum ( creep.carry ) == 0 )
            {
                //console.log ( creep.name+':', 'creep is empty. not attempting to find transfer target');
                creep.memory.currentTargetId = null;
                return Gather ( );
            }

            var target = GetTransferTarget ( Game.getObjectById ( creep.memory.currentTargetId ) );

            if ( target == null )
            {
                if ( creep.carry.energy < creep.carryCapacity * MAX_CURRENT_ENERGY_PCT_TO_GATHER )
                {
                    creep.memory.currentTargetId = null;
                    return Gather ( );
                }
            }
            else
            {
                creep.memory.currentTargetId = target.id;

                var result;

                if ( target instanceof StructureStorage )
                {
                    var resourceKey = _.findKey ( creep.carry, function (r) { return r > 0 } );
                    result = creep.transfer ( target, resourceKey );
                }
                else
                {
                    result = creep.transfer ( target, RESOURCE_ENERGY );
                }

                if ( result == ERR_NOT_IN_RANGE )
                {
                    result = creep.moveTo ( target, { visualizePathStyle: { stroke: '#00FF00', opacity: .8 } } );
                    if ( result < 0 )
                    {
                        console.log (creep.name+':',  'Error', result, 'returned on attempt to move' );
                    }
                }
                else if ( result < 0)
                {
                    console.log (creep.name+':',  'Error', result, ' returned when attempting to transfer resources to', target );
                }
            }

            return STATE.TRANSFERRING;
        }


        function ValidateHomeRoom ( homeRoomId )
        {
            if ( homeRoomId == undefined || homeRoomId == null ) return creep.room;

            return Game.getObjectById ( homeRoomId );
            
        }


        function ValidateCurrentState ( currentState )
        {
            if ( currentState == undefined || currentState == null ) return STATE.GATHERING;
            
            return currentState;
        }

        
        // MAIN CODE 
        const homeRoom = ValidateHomeRoom ( creep.memory.homeRoomId );

        var currentState = ValidateCurrentState ( creep.memory.currentState );

        creep.memory.currentState = STATE_MACHINE[ currentState ] ( );
    }
};

module.exports = roleWorker;