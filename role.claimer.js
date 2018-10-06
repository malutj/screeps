var roleClaimer = 
{
    spawn: function ( spawnPoint )
    {
        spawnPoint.createCreep ( [CLAIM,MOVE,MOVE], 'claimer'+Game.time.toString ( ), { role:'claimer', targetRoom: 'E58S7' } );
    },
    
    /** @param {Creep} creep **/
    run: function(creep) 
    {
        if ( creep.room.name != creep.memory.targetRoom )
        {
            const exitDir = creep.room.findExitTo(creep.memory.targetRoom);
            const exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
        }
        else
        {
            if ( Game.gcl.level >= 2 )
            {
                if ( creep.claimController ( creep.room.controller ) == ERR_NOT_IN_RANGE ) 
                {
                    creep.moveTo ( creep.room.controller );
                }
            }
            else if ( creep.reserveController ( creep.room.controller ) == ERR_NOT_IN_RANGE )
            {
                creep.moveTo ( creep.room.controller );
            }
        }
    }
}

module.exports = roleClaimer;