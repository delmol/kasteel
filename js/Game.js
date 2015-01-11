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
	
	this.formerMouse=-1; // Phaser.Mouse.NO_BUTTON

	this.game.time.desiredFps = 30;

    //collision on blockedLayer
    this.map.setCollisionBetween(1, 2000, true, 'blockedLayer');

    //resizes the game world to match the layer dimensions
    this.backgroundlayer.resizeWorld();

    this.createItems();
    this.createDoors();
	this.createkeyDoors();
	this.createNotes();
	
	//player shoot
	this.bullets = this.game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(30, 'spell1');
    this.bullets.setAll('anchor.x', 0.5);
	this.bulletTime = 1;

    //create player
    var result = this.findObjectsByType('playerStart', this.map, 'objectsLayer')
    this.player = this.game.add.sprite(result[0].x, result[0].y, 'player');
    this.game.physics.arcade.enable(this.player);
	var playerHealth = 10; 

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
  
  createkeyDoors: function() {
    //create doors
    this.keyDoors = this.game.add.group();
	this.keyDoors.enableBody = true;
	this.keyDoors.physicsBodyType = Phaser.Physics.ARCADE;
	
    result = this.findObjectsByType('switchdoor', this.map, 'objectsLayer');

    result.forEach(function(element){
      this.createFromTiledObject(element, this.keyDoors);
    }, this);
  },
  
  createNotes: function() {
    //create notes
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
        element.y -= map.tileHeight;
        result.push(element);
      }
    });
    return result;
  },
  
  //create a sprite from an object
  createFromTiledObject: function(element, group) {
    var sprite = group.create(element.x, element.y, element.properties.sprite);
	
	if(group == this.keyDoors){
		sprite.body.immovable = true;
	}

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
	this.game.physics.arcade.collide(this.player, this.keyDoors);
	this.game.physics.arcade.collide(this.keyDoors, this.blockedLayer);
	this.game.physics.arcade.collide(this.bullet, this.blockedLayer, this.bulletCollide);

    //player movement
    this.player.body.velocity.y = 0;
    this.player.body.velocity.x = 0;

	//camera movement
	this.cameraPos.x += (this.player.x - this.cameraPos.x) * this.cameraLerp; // smoothly adjust the x position
	this.cameraPos.y += (this.player.y - this.cameraPos.y) * this.cameraLerp; // smoothly adjust the y position
	this.game.camera.focusOnXY(this.cameraPos.x, this.cameraPos.y);


    if(this.upButton.isDown) {
      this.player.body.velocity.y -= 50;
    }
    else if(this.downButton.isDown) {
      this.player.body.velocity.y += 50;
    }
    if(this.leftButton.isDown) {
      this.player.body.velocity.x -= 50;
	  this.player.flipped = true;
    }
    else if(this.rightButton.isDown) {
		this.player.body.velocity.x += 50;
    }
	
	if (this.input.mouse.button==0){
         if (this.formerMouse==-1) {

        } else {
           this.shoot();
        }
     }
     this.formerMouse=this.input.mouse.button;

  },
  
  shoot: function(){
  //  To avoid them being allowed to fire too fast we set a time limit
    if (this.game.time.now > this.bulletTime)
    {
        //  Grab the first bullet we can from the pool
		this.bullet = this.bullets.getFirstExists(false);

        if (this.bullet)
        {
            //  And fire it
            this.bullet.reset(this.player.x + 5, this.player.y + 8);
			this.bullet.rotation = this.game.physics.arcade.moveToPointer(this.bullet, 100, this.input.activePointer)
            this.bulletTime = this.game.time.now + 700;
        }
    }
  },
  
  bulletCollide: function(bullet, blockedLayer){
	bullet.kill();
  },
  
  collect: function(player, collectable) {
    console.log('collected');
    collectable.destroy();
  },
  
  enterDoor: function(player, door) {
    console.log('entering door that will take you to '+door.targetTilemap+' on x:'+door.targetX+' and y:'+door.targetY);
  },
  
  readNote: function(player, note) {
    var style = { font: "10px Courier New", fill: "#ffffff", wordWrap: true, wordWrapWidth: 128, align: "center" };
	this.noteText = this.game.add.text(0, 0, note.text, style);
    this.noteText.anchor.set(0.5);
	this.noteText.x = note.x;
	this.noteText.y = note.y;
  },
};
