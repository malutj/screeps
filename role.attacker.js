var roleAttacker = {

    /** @param {Creep} creep **/
    run: function(creep) 
    {
        if ( creep.room.name != creep.memory.targetRoom )
        {
            const exitDir = creep.room.findExitTo(creep.memory.targetRoom);
            const exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit, { visualizePathStyle: {stroke: '#ffffff'} });
        }
        else
        {
            var targets = creep.pos.findClosestByRange(creep.room.find(FIND_HOSTILE_CREEPS));

            if (targets)
            {
                if ( creep.attack(targets) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo(targets, { visualizePathStyle: { stroke: '#e50000' } } );
                }

                return;
            }

            targets = creep.pos.findClosestByRange(creep.room.find(FIND_HOSTILE_SPAWNS));

            if (targets)
            {
                if ( creep.attack(targets) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo(targets, { visualizePathStyle: { stroke: '#e50000' } } );
                }

                return;
            }

            targets = creep.pos.findClosestByRange(creep.room.find(FIND_HOSTILE_STRUCTURES));

            if (targets)
            {
                if ( creep.attack(targets) == ERR_NOT_IN_RANGE )
                {
                    creep.moveTo(targets, { visualizePathStyle: { stroke: '#e50000' } } );
                }

                return;
            }
        }
    }
};

module.exports = roleAttacker;