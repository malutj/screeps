var roleSniper = 
{
    spawn: function ( spawnPoint )
    {
        var energySource1 =  { energyRoom: 'E58S7', source: '59bbc5bb2052a716c3ce9f20', snipers: [] };
        var energySource2 =  { energyRoom: 'E58S8', source: '59bbc5bc2052a716c3ce9f22', snipers: [] };
        //var energySource3 =  { energyRoom: 'E58S6', source: '59bbc5bb2052a716c3ce9f1d', snipers: [] };

        var currentSnipers = _.filter ( Game.creeps, ( c ) => c.memory.role == 'sniper' );

        for ( var i = 0; i < currentSnipers.length; i++ )
        {
            if ( currentSnipers[i].memory.energySource == energySource1.source )
            {
                energySource1.snipers.push ( currentSnipers[i] );
            }
            else if ( currentSnipers[i].memory.energySource == energySource2.source )
            {
              energySource2.snipers.push ( currentSnipers[i] );
            }
            //else if ( currentSnipers[i].memory.energySource == energySource3.source )
            //{
            //   energySource3.snipers.push ( currentSnipers[i] );
            //}
            else
            {
                console.log(currentSnipers[i].name,'has an unknown energy source assigned');
                return;
            }
        }

        var newSniperTargetRoom;
        var newSniperTargetEnergy;
        var body = [ WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        if ( energySource1.snipers.length < 2 )
        {
            newSniperTargetRoom = energySource1.energyRoom;
            newSniperTargetEnergy = energySource1.source;
        }
        else if ( energySource2.snipers.length < 2 )
        {
            newSniperTargetRoom = energySource2.energyRoom;
            newSniperTargetEnergy = energySource2.source;
        }
        /*else
        {
            newSniperTargetRoom = energySource3.energyRoom;
            newSniperTargetEnergy = energySource3.source;
            body = [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }*/

        spawnPoint.createCreep ( body, 'sniper'+Game.time.toString ( ), { role:'sniper', energyRoom: newSniperTargetRoom, energySource: newSniperTargetEnergy } );
    },
    
    /** @param {Creep} creep **/
    run: function(creep) 
    {
        if ( creep.memory.state != 'dumping')
        {
            if ( creep.carry.energy < creep.carryCapacity ) 
            {
                if ( creep.room.name != creep.memory.energyRoom )
                {
                    const exitDir = creep.room.findExitTo( creep.memory.energyRoom );
                    const exit = creep.pos.findClosestByRange(exitDir);
                    creep.moveTo(exit, {visualizePathStyle: {stroke: '#ffffff'}} );
                }
                else
                {
                    var target = Game.getObjectById(creep.memory.energySource);   
                    var result = creep.harvest ( target );
                    if ( result == ERR_NOT_IN_RANGE )
                    {
                        creep.moveTo ( target, {visualizePathStyle: {stroke: '#ffffff'}} );
                    }
                }
            }
            else
            {
                creep.memory.state = 'dumping';
            }
        }
        else
        {
            if ( creep.carry.energy == 0 )
            {
                creep.memory.state = 'loading';
            }
            else
            {
                var target = Game.spawns['Base'].room.storage;
            
                if ( target )
                {
                    if ( creep.transfer ( target, RESOURCE_ENERGY ) == ERR_NOT_IN_RANGE )
                    {
                        creep.moveTo  (target, {visualizePathStyle: {stroke: '#FFE56D', opacity: 0.6}} );
                    }
                } 
            }
        }
    }
}

module.exports = roleSniper;