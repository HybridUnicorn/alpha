var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Contrast;
(function (Contrast) {
    var Boot = (function (_super) {
        __extends(Boot, _super);
        function Boot() {
            _super.apply(this, arguments);
        }
        Boot.prototype.preload = function () {
        };

        Boot.prototype.create = function () {
            // Game config
            this.game.stage.backgroundColor = 0xffffff;
            this.game.physics.startSystem(Phaser.Physics.ARCADE);

            this.game.state.start('loader');
        };
        return Boot;
    })(Phaser.State);
    Contrast.Boot = Boot;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Checkpoint = (function (_super) {
        __extends(Checkpoint, _super);
        function Checkpoint(game, x, y) {
            _super.call(this, game, x, y, 'pixel');

            this.scale.setTo(16, this.game.world.height);
            this.y = this.game.world.height;

            this.alpha = 0;

            this.spawn = { x: x, y: y };
        }
        return Checkpoint;
    })(Phaser.Sprite);
    Contrast.Checkpoint = Checkpoint;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Dual = (function (_super) {
        __extends(Dual, _super);
        function Dual(game, x, y, key) {
            _super.call(this, game, x, y, key);
            this.soulmate = this.game.add.sprite(x, y, key);
            this.soulmate.anchor.setTo(0, 1);
        }
        Dual.prototype.setTint = function (tint) {
            this.tint = tint;
            this.soulmate.tint = tint;
        };

        Dual.prototype.setMask = function (spot) {
            this.mask = spot.getAura();
            this.soulmate.mask = spot.getMate();
        };
        return Dual;
    })(Phaser.Sprite);
    Contrast.Dual = Dual;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var End = (function (_super) {
        __extends(End, _super);
        function End(game, x, y) {
            _super.call(this, game, x, y, 'pixel');

            this.scale.setTo(40, this.game.world.height);
            this.y = this.game.world.height;
        }
        return End;
    })(Phaser.Sprite);
    Contrast.End = End;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Entities = (function () {
        function Entities() {
        }
        return Entities;
    })();
    Contrast.Entities = Entities;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game() {
            _super.call(this, 480, 320, Phaser.AUTO, 'content', null, false, true);

            this.state.add('boot', Contrast.Boot);
            this.state.add('loader', Contrast.Loader);
            this.state.add('menu', Contrast.Menu);
            this.state.add('level', Contrast.Level);

            this.state.start('boot');
        }
        return Game;
    })(Phaser.Game);
    Contrast.Game = Game;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Level = (function (_super) {
        __extends(Level, _super);
        function Level() {
            _super.apply(this, arguments);
        }
        Level.prototype.create = function () {
            this.createMap();
            this.createLevel();
            this.createCheckpoints();
            this.createEnd();
            this.createPlayer();
            this.createSpot();
            this.createEnemies();
            this.createPlatforms();
            this.createDebug();
        };

        Level.prototype.update = function () {
            this.game.physics.arcade.collide(this.player, this.layer);
            this.game.physics.arcade.collide(this.player, Contrast.Entities.platforms);
            this.game.physics.arcade.overlap(this.player, Contrast.Entities.peaks, this.respawn, null, this);
            this.game.physics.arcade.overlap(this.player, Contrast.Entities.checkpoints, this.checkpoint, null, this);
            this.game.physics.arcade.overlap(this.player, Contrast.Entities.end, this.ending, null, this);
            this.movePlayer();
            this.spot.update();
        };

        Level.prototype.render = function () {
            if (!this.game.time.advancedTiming) {
                return;
            }

            this.game.debug.text(this.game.time.fps.toString() || "--", 2, 14, "#00ff00");
        };

        /*
        ** Core feature
        */
        // Respawn player after a death
        Level.prototype.respawn = function () {
            this.player.x = this.spawn.x;
            this.player.y = this.spawn.y;
        };

        // Store last checkpoint
        Level.prototype.checkpoint = function (player, checkpoint) {
            this.spawn.x = checkpoint.spawn.x;
            this.spawn.y = checkpoint.spawn.y;

            checkpoint.destroy();
        };

        // End level
        Level.prototype.ending = function () {
            alert('The End ! =3');
            this.game.state.start('menu');
        };

        // Move player according to the pressed key
        Level.prototype.movePlayer = function () {
            // Vertical movement
            if (this.cursor.left.isDown) {
                this.player.body.velocity.x = -200;
            } else if (this.cursor.right.isDown) {
                this.player.body.velocity.x = 200;
            } else {
                this.player.body.velocity.x = 0;
            }

            // Jump movement
            if (this.cursor.up.isDown && (this.player.body.onFloor() || this.player.body.touching.down)) {
                this.player.body.velocity.y = -420;
            }
        };

        /*
        ** Entity Factory
        */
        Level.prototype.createMap = function () {
            this.map = this.game.add.tilemap(Contrast.Game.level_name);
            this.map.addTilesetImage('tileset', 'tileset');

            // Replace string by real hex
            var prop = ['ocean', 'contrast', 'anomaly'];
            for (var i in prop) {
                var color = Phaser.Color.valueToColor(this.map.properties[prop[i]]);
                this.map.properties[prop[i]] = Phaser.Color.getColor(color.r, color.g, color.b);
            }
        };

        Level.prototype.createPlayer = function () {
            // Get player spawn
            var spawns = this.game.add.group();
            this.map.createFromObjects('object', 5, null, 0, false, false, spawns);
            var spawn = spawns.getChildAt(0);

            // Frirst death point
            this.spawn = { x: spawn.x, y: spawn.y };

            // Player sprite
            this.player = this.game.add.sprite(spawn.x, spawn.y, 'player');
            this.game.physics.arcade.enable(this.player);
            this.player.checkWorldBounds = true;
            this.player.events.onOutOfBounds.add(this.respawn, this);
            this.player.body.gravity.y = 980;
            this.player.anchor.setTo(0.5, 0.5);
            this.player.tint = this.map.properties['ocean'];
            this.cursor = this.game.input.keyboard.createCursorKeys();
            this.game.camera.follow(this.player);

            spawns.destroy();
        };

        Level.prototype.createSpot = function () {
            this.spot = new Contrast.Spot(this.game, this.player);

            this.spot.setTint(this.map.properties['contrast']);

            // Sort Z Index
            this.world.bringToTop(this.player);
            this.world.bringToTop(this.layer);
        };

        Level.prototype.createLevel = function () {
            this.layer = this.map.createLayer('ground');
            this.layer.resizeWorld();

            this.map.setCollision(2);
            this.game.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

            // Tint background and ground
            this.game.stage.backgroundColor = this.map.properties['ocean'];
            this.layer.tint = this.map.properties['ocean'];
        };

        Level.prototype.createEnemies = function () {
            Contrast.Entities.peaks = this.game.add.group();
            Contrast.Entities.peaks.enableBody = true;

            this.map.createFromObjects('object', 9, 'peak', 0, true, false, Contrast.Entities.peaks, Contrast.Dual);

            Contrast.Entities.peaks.callAll('setTint', '', this.map.properties['anomaly']);
            Contrast.Entities.peaks.callAll('setMask', '', this.spot);
        };

        Level.prototype.createPlatforms = function () {
            Contrast.Entities.platforms = this.game.add.group();

            this.map.createFromObjects('object', 6, null, 0, true, false, Contrast.Entities.platforms, Contrast.Platform);

            Contrast.Entities.platforms.callAll('move', '');

            Contrast.Entities.platforms.setAll('tint', this.map.properties['ocean']);
        };

        Level.prototype.createCheckpoints = function () {
            Contrast.Entities.checkpoints = this.game.add.group();
            Contrast.Entities.checkpoints.enableBody = true;

            this.map.createFromObjects('object', 7, null, 0, true, false, Contrast.Entities.checkpoints, Contrast.Checkpoint);
        };

        Level.prototype.createEnd = function () {
            // Get player spawn
            Contrast.Entities.end = this.game.add.group();
            Contrast.Entities.end.enableBody = true;

            this.map.createFromObjects('object', 8, null, 0, true, false, Contrast.Entities.end, Contrast.End);
        };

        Level.prototype.createDebug = function () {
            var _this = this;
            this.debugKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
            this.debugKey.onDown.add(function () {
                if (_this.game.time.advancedTiming) {
                    _this.game.debug.reset();
                }
                _this.game.time.advancedTiming = !_this.game.time.advancedTiming;
            }, this);
            this.game.time.advancedTiming = false;
        };
        return Level;
    })(Phaser.State);
    Contrast.Level = Level;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Loader = (function (_super) {
        __extends(Loader, _super);
        function Loader() {
            _super.apply(this, arguments);
        }
        Loader.prototype.preload = function () {
            // Level data
            this.load.tilemap('level_test', 'assets/level_test.json', null, Phaser.Tilemap.TILED_JSON);
            this.load.tilemap('level_basic', 'assets/level_basic.json', null, Phaser.Tilemap.TILED_JSON);

            // Sprites
            this.load.image('tileset', 'assets/tileset.png');
            this.load.image('player', 'assets/player.png');
            this.load.image('peak', 'assets/peak.png');
            this.load.image('platform', 'assets/platform.png');
            this.load.image('pixel', 'assets/pixel.png');
        };

        Loader.prototype.create = function () {
            this.game.state.start('menu');
        };
        return Loader;
    })(Phaser.State);
    Contrast.Loader = Loader;
})(Contrast || (Contrast = {}));
window.onload = function () {
    var game = new Contrast.Game();
};
var Contrast;
(function (Contrast) {
    var Menu = (function (_super) {
        __extends(Menu, _super);
        function Menu() {
            _super.apply(this, arguments);
        }
        Menu.prototype.create = function () {
            // Set next level name
            Contrast.Game.level_name = 'level_basic';

            this.game.state.start('level');
        };
        return Menu;
    })(Phaser.State);
    Contrast.Menu = Menu;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Platform = (function (_super) {
        __extends(Platform, _super);
        function Platform(game, x, y) {
            _super.call(this, game, x, y, 'platform');

            this.game.physics.arcade.enable(this);

            this.body.immovable = true;
        }
        Platform.prototype.move = function () {
            if (this.vertical) {
                this.vertical = parseInt(this.vertical);

                this.max = this.y;
                this.min = this.y - this.vertical * 40;

                this.body.velocity.y = -100;
            }

            if (this.horizontal) {
                this.horizontal = parseInt(this.horizontal);

                this.min = this.x;
                this.max = this.x + this.horizontal * 40;

                this.body.velocity.x = 100;
            }
        };

        Platform.prototype.update = function () {
            // Y Bounce
            if (this.vertical) {
                if (this.y < this.min) {
                    this.body.velocity.y = 100;
                } else if (this.y > this.max) {
                    this.body.velocity.y = -100;
                }
            }

            // X Bounce
            if (this.horizontal) {
                if (this.x < this.min) {
                    this.body.velocity.x = 100;
                } else if (this.x > this.max) {
                    this.body.velocity.x = -100;
                }
            }

            _super.prototype.update.call(this);
        };
        return Platform;
    })(Phaser.Sprite);
    Contrast.Platform = Platform;
})(Contrast || (Contrast = {}));
var Contrast;
(function (Contrast) {
    var Spot = (function () {
        function Spot(game, player) {
            this.game = game;

            this.player = player;

            this.shape = new Round(this.game, this.player);
        }
        Spot.prototype.update = function () {
            this.shape.update();
        };

        Spot.prototype.setTint = function (tint) {
            this.shape.aura.tint = tint;
            this.shape.mate.tint = tint;
        };

        Spot.prototype.getAura = function () {
            return this.shape.ghost_aura;
        };

        Spot.prototype.getMate = function () {
            return this.shape.ghost_mate;
        };
        return Spot;
    })();
    Contrast.Spot = Spot;

    var Base = (function () {
        function Base(game, player) {
            this.game = game;
            this.player = player;

            this.aura = this.game.add.graphics(0, 0);
            this.mate = this.game.add.graphics(0, 0);

            this.ghost_aura = this.game.add.graphics(0, 0);
            this.ghost_mate = this.game.add.graphics(0, 0);
        }
        Base.prototype.update = function () {
        };
        return Base;
    })();

    var Round = (function (_super) {
        __extends(Round, _super);
        function Round(game, player) {
            _super.call(this, game, player);

            // Draw them
            this.create(this.aura, 100);
            this.create(this.mate, 60);
            this.create(this.ghost_aura, 100);
            this.create(this.ghost_mate, 60);

            // Scale of mate one
            //this.mate.scale.set(0, 0)
            //this.ghost_mate.scale.set(0, 0)
            this.aura.position = this.player.position;
            this.ghost_aura.position = this.player.position;

            this.mate.fixedToCamera = this.ghost_mate.fixedToCamera = true;

            this.mate.cameraOffset = this.game.input.position;
            this.ghost_mate.cameraOffset = this.game.input.position;
        }
        Round.prototype.create = function (graphics, radius) {
            graphics.beginFill(0xFFFFFF);
            graphics.drawCircle(0, 0, radius);
        };

        Round.prototype.update = function () {
        };
        return Round;
    })(Base);
})(Contrast || (Contrast = {}));
//# sourceMappingURL=game.js.map
