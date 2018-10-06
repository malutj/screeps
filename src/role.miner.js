var roleMiner = {

    spawn: function ( spawnPoint )
    {
        var containers = spawnPoint.room.find ( FIND_STRUCTURES, { filter: { structureType: STRUCTURE_CONTAINER } } );
        var minersInThisRoom = _.filter (Game.creeps, (c)=> ( c.memory.role == 'miner' && c.room === spawnPoint.room ) );
        if ( containers.length )
        {
            for ( var i = 0; i < containers.length; ++i )
            {
                var minerIsAssigned = false;
                for ( var j = 0; j < minersInThisRoom.length; ++j )
                {
                    if ( minersInThisRoom[ j ].memory.container == containers[ i ].id )
                    {               
                        minerIsAssigned = true;
                        break;
                    }
                }
    
                if ( minerIsAssigned == false )
                {
                    // THIS MEANS WE HAVE A CONTAINER THAT DOESN'T 
                    // HAVE AN ASSOCIATED MINER, SO WE'LL SPAWN ONE NOW
                    spawnPoint.createCreep( [ WORK,WORK,WORK,WORK,WORK,MOVE], 'miner'+Game.time.toString(), { role:'miner', status:'mining', container: containers[ i ].id } );
                }
            }
        }
    },

    /** @param {Creep} creep **/
    run: function(creep) 
    {
        var c = Game.getObjectById(creep.memory.container);   

        if (creep.pos.x != c.pos.x || creep.pos.y != c.pos.y)
        {
            creep.moveTo(c, {visualizePathStyle: {stroke: '#ffffff'}});
        }
        else
        {
            var energySource = c.pos.findClosestByRange ( FIND_SOURCES );
            creep.harvest(energySource);
        }
    }
};

module.exports = roleMiner;