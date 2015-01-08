var TopDownGame = TopDownGame || {};

//title screen
TopDownGame.Game = function(){};

TopDownGame.Game.prototype = {
  create: function() {
    this.map = this.game.add.tilemap('level1');

    //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
    this.map.addTilesetImage('tiles', 'gameTiles');
	
	Phaser.Canvas.setSmoothingEnabled(this.game.context, false);
	this.game.stage.smoothed = false;

    //create layer
    this.backgroundlayer = this.map.createLayer('backgroundLayer');
    this.blockedLayer = this.map.createLayer('blockedLayer');
	
	this.stage.backgroundColor = '#000000';
	
	this.game.time.desiredFps = 30;

    //collision on blockedLayer
    this.map.setCollisionBetween(1, 2000, true, 'blockedLayer');

    //resizes the game world to match the layer dimensions
    this.backgroundlayer.resizeWorld();

    this.createItems();
    this.createDoors();   
	this.createNotes();

    //create player
    var result = this.findObjectsByType('playerStart', this.map, 'objectsLayer')
    this.player = this.game.add.sprite(result[0].x, result[0].y, 'player');
    this.game.physics.arcade.enable(this.player);

    //the camera will follow the player in the world
    //this.game.camera.follow(this.player);
	this.cameraPos = new Phaser.Point(result[0].x, result[0].y); // store the smoothed virtual camera position
	this.cameraLerp = 0.05;

    //move player with cursor keys
    this.cursors = this.game.input.keyboard.createCursorKeys();
	this.upButton = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
	this.downButton = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
	this.leftButton = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
	this.rightButton = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

  },
  createItems: function() {
    //create items
    this.items = this.game.add.group();
    this.items.enableBody = true;
    var item;    
    result = this.findObjectsByType('item', this.map, 'objectsLayer');
    result.forEach(function(element){
      this.createFromTiledObject(element, this.items);
    }, this);
  },
  createDoors: function() {
    //create doors
    this.doors = this.game.add.group();
    this.doors.enableBody = true;
    result = this.findObjectsByType('door', this.map, 'objectsLayer');

    result.forEach(function(element){
      this.createFromTiledObject(element, this.doors);
    }, this);
  },
  createNotes: function() {
    //create doors
	
    this.notes = this.game.add.group();
    this.notes.enableBody = true;
	var note;
    result = this.findObjectsByType('note', this.map, 'objectsLayer');

    result.forEach(function(element){
      this.createFromTiledObject(element, this.notes);
    }, this);
  },

  //find objects in a Tiled layer that contains a property called "type" equal to a certain value
  findObjectsByType: function(type, map, layer) {
    var result = new Array();
    map.objects[layer].forEach(function(element){
      if(element.properties.type === type) {
        //Phaser uses top left, Tiled bottom left so we have to adjust
        //also keep in mind that the cup images are a bit smaller than the tile which is 16x16
        //so they might not be placed in the exact position as in Tiled
        element.y -= map.tileHeight;
        result.push(element);
      }      
    });
    return result;
  },
  //create a sprite from an object
  createFromTiledObject: function(element, group) {
    var sprite = group.create(element.x, element.y, element.properties.sprite);

      //copy all properties to the sprite
      Object.keys(element.properties).forEach(function(key){
        sprite[key] = element.properties[key];
      });
  },
  update: function() {
    //collision
    this.game.physics.arcade.collide(this.player, this.blockedLayer);
    this.game.physics.arcade.overlap(this.player, this.items, this.collect, null, this);
    this.game.physics.arcade.overlap(this.player, this.doors, this.enterDoor, null, this);
	this.game.physics.arcade.overlap(this.player, this.notes, this.readNote, null, this);

    //player movement
    this.player.body.velocity.y = 0;
    this.player.body.velocity.x = 0;
	
	//camera movement
	this.cameraPos.x += (this.player.x - this.cameraPos.x) * this.cameraLerp; // smoothly adjust the x position
	this.cameraPos.y += (this.player.y - this.cameraPos.y) * this.cameraLerp; // smoothly adjust the y position
	this.game.camera.focusOnXY(this.cameraPos.x, this.cameraPos.y);
	

    if(this.upButton.isDown) {
      this.player.y -= 2;
    }
    else if(this.downButton.isDown) {
      this.player.body.velocity.y += 50;
    }
    if(this.leftButton.isDown) {
      this.player.x -= 2;
	  this.player.flipped = true;
    }
    else if(this.rightButton.isDown) {
		this.player.x += 2;
    }
  },
  collect: function(player, collectable) {
    console.log('yummy!');

    //remove sprite
    collectable.destroy();
  },
  enterDoor: function(player, door) {
  console.log('khfghjf');
    console.log('entering door that will take you to '+door.targetTilemap+' on x:'+door.targetX+' and y:'+door.targetY);
  },
  readNote: function(player, note) {
    console.log(note.text);
  },
};
