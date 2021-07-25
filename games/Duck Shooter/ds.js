const EVENT_MOUSE_MOVE = 0;
const EVENT_MOUSE_DOWN = 1;

const FRAME_TIME = 1.0 / 60.0;

const ASSET_BIRD1_PNG = 0;
const ASSET_BIRD2_PNG = 1;
const ASSET_BIRD3_PNG = 2;
const ASSET_TINCAN_PNG = 3;
const ASSET_CROSSHAIR_PNG = 4;
const ASSET_POW_PNG = 5;
const ASSET_FALLING_CURTAIN_PNG = 6;
const ASSET_LEFT_CURTAIN_PNG = 7;
const ASSET_RIGHT_CURTAIN_PNG = 8;
const ASSET_FALLING_RESULT_SIGN_PNG = 9;
const ASSET_GAME_SIGN_PNG = 10;
const ASSET_GAME_BACKGROUND_PNG = 11;
const ASSET_MUSIC_MP3 = 12;
const ASSET_GUNSHOT1_MP3 = 13;
const ASSET_TINCAN_MP3 = 14;
const ASSET_QUACK_MP3 = 15;

const TARGET_TYPE_BIRD1 = 0;
const TARGET_TYPE_BIRD2 = 1;
const TARGET_TYPE_BIRD3 = 2;
const TARGET_TYPE_TINCAN = 3;

const GRAVITY_OFF = 0;
const GRAVITY_ON = 1;

const PARTICLE_LIVE_TIME = 20;

const GAME_STATE_MENU = 0;
const GAME_STATE_MAIN = 1;
const GAME_STATE_SCORE = 2;
const GAME_STATE_TRANSITION = 3;
const GAME_STATE_REPLAY = 4;

const GAME_MAIN_LENGTH = 1800;

const ANIM_CURTAIN_LENGTH = 180;

const REPLAY_INPUT = 0;
const REPLAY_SPAWN = 1;

const WIDTH = 960;
const HEIGHT = 640;

function win_init() {
    let c = document.getElementById("aim-game-display");

    return {
        _c: c,
    };
}

function win_create_input(win) {
    let event_buffer = [];

    win._c.addEventListener("mousemove", function(e) {
        event_buffer.push({
            type: EVENT_MOUSE_MOVE,
            x: e.offsetX,
            y: e.offsetY
        });
    });

    win._c.addEventListener("mousedown", function(e) {
        event_buffer.push({
            type: EVENT_MOUSE_DOWN
        });
    });

    return {
        _event_buffer: event_buffer
    };
}

function win_create_context(win) {
    let ctx = win._c.getContext("2d");

    return {
        _ctx: ctx
    };
}

function play_sound(sfx) {
    sfx.cache[sfx.cache_ptr].play();
    sfx.cache_ptr = (sfx.cache_ptr + 1) % (sfx.cache.length - 1);
}

function game_create(assetlib) {
    return {
        unprocessed_time: 0,
        tick: 0,
        state: GAME_STATE_MENU,
        replay_system: {
            log: [],
            event_ptr: 0
        },
        score_system: {
            total_score: 0
        },
        crosshair_system: {
            x: 0,
            y: 0,
            shoot: false,
            sfx: assetlib[ASSET_GUNSHOT1_MP3],
            tex: assetlib[ASSET_CROSSHAIR_PNG],
            sprite: undefined
        },
        target_system: {
            objects: [],
            tex: [
                assetlib[ASSET_BIRD1_PNG],
                assetlib[ASSET_BIRD2_PNG],
                assetlib[ASSET_BIRD3_PNG],
                assetlib[ASSET_TINCAN_PNG]
            ],
            sfx: [
                assetlib[ASSET_QUACK_MP3],
                assetlib[ASSET_QUACK_MP3],
                assetlib[ASSET_QUACK_MP3],
                assetlib[ASSET_TINCAN_MP3]
            ],
            hitbox: [
                6000,
                9000,
                9000,
                4900
            ]
        },
        particle_system: {
            objects: [],
            tex: assetlib[ASSET_POW_PNG]
        },
        background_system: {
            tex: assetlib[ASSET_GAME_BACKGROUND_PNG],
            music: assetlib[ASSET_MUSIC_MP3]
        },
        sprite_system: {
            objects: []
        },
        menu_system: {
            gamesign: {
                tex: assetlib[ASSET_GAME_SIGN_PNG]
            },
            score: {
                sign: assetlib[ASSET_FALLING_RESULT_SIGN_PNG]
            },
            curtain: {
                curtain_left: assetlib[ASSET_LEFT_CURTAIN_PNG],
                curtain_right: assetlib[ASSET_RIGHT_CURTAIN_PNG],
                curtain_falling: assetlib[ASSET_FALLING_CURTAIN_PNG]
            }
        }
    };
}

function replay_log(replay_system, type, tick, data) {
    replay_system.log.push({
        type: type,
        tick: tick,
        data: data
    });
}

function crosshair_pump(crosshair_system, input_event) {
    switch (input_event.type) {
        case EVENT_MOUSE_MOVE:
            crosshair_system.x = input_event.x;
            crosshair_system.y = HEIGHT - input_event.y;
            break;
        case EVENT_MOUSE_DOWN:
            crosshair_system.shoot = true;
            break;
    }
}

function crosshair_update(crosshair_system, particle_system, target_system, score_system, replay_system, sprite_system, tick, update_score) {
    let copy_crosshair = {
        x: crosshair_system.x,
        y: crosshair_system.y,
        shoot: crosshair_system.shoot,
    };

    replay_log(replay_system, REPLAY_INPUT, tick, copy_crosshair);

    if (crosshair_system.shoot) {
        play_sound(crosshair_system.sfx);
        crosshair_system.shoot = false;

        for (let i = 0; i < target_system.objects.length; i++) {
            let target = target_system.objects[i];

            let dx = crosshair_system.x - target.x;
            let dy = crosshair_system.y - target.y;

            let distance = dx * dx + dy * dy;

            if (distance < target_system.hitbox[target.type]) {
                particle_create(
                    particle_system,
                    sprite_system,
                    crosshair_system.x, crosshair_system.y,
                    PARTICLE_LIVE_TIME
                );


                switch (target.type) {
                    case TARGET_TYPE_BIRD1:
                    case TARGET_TYPE_BIRD2:
                    case TARGET_TYPE_BIRD3:
                        score_system.total_score += 10;
                        break;
                    case TARGET_TYPE_TINCAN:
                        score_system.total_score += 20;
                        break;
                }

                target.hit = true;
                play_sound(target_system.sfx[target.type]);
                return;
            }
        }

        if (update_score)
            score_system.total_score -= 5;
    }
}

function crosshair_render(crosshair_system, renderer) {
    let w = 0.5 * crosshair_system.tex.width;
    let h = 0.5 * crosshair_system.tex.height;

    let x = crosshair_system.x - w / 2;
    let y = HEIGHT - crosshair_system.y - h / 2;

    renderer._ctx.setTransform(
        0.5, 0,
        0, 0.5,
        x, y
    );

    renderer._ctx.drawImage(crosshair_system.tex, 0, 0);
}

function background_render(background_system, renderer) {
    renderer._ctx.setTransform(
        1, 0,
        0, 1,
        0, 0
    );

    renderer._ctx.drawImage(background_system.tex, 0, 0);
}

function sprite_system_remove(sprite_system, sprite) {
    let index = sprite_system.objects.indexOf(sprite);
    if (index != -1)
        sprite_system.objects.splice(index, 1);
}

function sprite_create(sprite_system, tex, x, y, w, h) {
    let sprite = {
        x: x,
        y: y,
        w: w,
        h: h,
        tex: tex
    };

    sprite_system.objects.push(sprite);

    return sprite;
}

function sprite_render(sprite_system, renderer) {
    for (let i = 0; i < sprite_system.objects.length; i++) {
        let sprite = sprite_system.objects[i];

        let x = sprite.x - sprite.w * sprite.tex.width / 2;
        let y = HEIGHT - sprite.y - sprite.h * sprite.tex.height / 2;

        let w = sprite.w;
        let h = sprite.h;

        renderer._ctx.setTransform(
            w, 0,
            0, h,
            x, y
        );

        renderer._ctx.drawImage(sprite.tex, 0, 0);
    }
}

function particle_system_remove(particle_system, particle) {
    let index = particle_system.objects.indexOf(particle);
    if (index != -1)
        particle_system.objects.splice(index, 1);
}

function particle_create(particle_system, sprite_system, x, y, live_time) {
    let particle = {
        x: x,
        y: y,
        live_time: live_time,
        sprite: sprite_create(sprite_system, particle_system.tex, x, y, 1, 1)
    };

    particle_system.objects.push(particle);

    return particle;
}

function particle_update(particle_system, sprite_system) {
    for (let i = particle_system.objects.length - 1; i >= 0; i--) {
        let particle = particle_system.objects[i];
        if (--particle.live_time == 0) {
            particle_system_remove(particle_system, particle);
            sprite_system_remove(sprite_system, particle.sprite);
            break;
        }

        let x = 1 - particle.live_time / PARTICLE_LIVE_TIME;
        let y = -3 * x * x + 2 * x + 1;

        particle.sprite.w = y;
        particle.sprite.h = y;
    }
}

function target_system_remove(target_system, target) {
    let index = target_system.objects.indexOf(target);
    if (index != -1)
        target_system.objects.splice(index, 1);
}

function target_create(target_system, sprite_system, type, gravity, x, y, xvel, yvel) {
    let w = -xvel / Math.abs(xvel);

    let new_target = {
        type: type,
        x: x,
        y: y,
        xvel: xvel,
        yvel: yvel,
        gravity: gravity,
        hit: false,
        sprite: sprite_create(sprite_system, target_system.tex[type], x, y, w, 1)
    };

    target_system.objects.push(new_target);

    return new_target;
}

function target_update(target_system, sprite_system) {
    for (let i = target_system.objects.length - 1; i >= 0; i--) {
        let target = target_system.objects[i];

        if (target.hit ||
            target.x + Math.abs(target.sprite.w) * target.sprite.tex.width < 0 ||
            target.x - Math.abs(target.sprite.w) * target.sprite.tex.width > WIDTH) {
            target_system_remove(target_system, target);
            sprite_system_remove(sprite_system, target.sprite);
            break;
        }

        target.x += target.xvel;
        target.y += target.yvel;

        target.yvel -= 0.3 * target.gravity;

        target.sprite.x = target.x;
        target.sprite.y = target.y;
    }
}

function pump(game, input) {
    for (let i = 0; i < input._event_buffer.length; i++)
        crosshair_pump(game.crosshair_system, input._event_buffer[i]);

    input._event_buffer.length = 0;
}

function director_update(target_system, sprite_system, replay_system, tick) {
    let max_target = 2 * (1 + Math.floor(tick / 600));

    if (tick % 20 == 0 && target_system.objects.length < max_target) {
        let type = Math.floor(Math.random() * 4);
        let side = Math.floor(Math.random() * 2);
        let vel = (7 + Math.floor(Math.random() * 5)) * -(side * 2 - 1);
        let x = WIDTH * side;
        let y = 40 + Math.floor(Math.random() * 200);

        let target;
        switch (type) {
            case TARGET_TYPE_BIRD1:
            case TARGET_TYPE_BIRD2:
            case TARGET_TYPE_BIRD3:
                target = target_create(
                    target_system,
                    sprite_system,
                    type, GRAVITY_OFF, x, y, vel, 0
                );
                break;
            case TARGET_TYPE_TINCAN:
                target = target_create(
                    target_system,
                    sprite_system,
                    type, GRAVITY_ON, x, y, vel, 5 + Math.random() * 10
                );
                break;
        }

        let copy_target = {
            type: target.type,
            x: target.x,
            y: target.y,
            xvel: target.xvel,
            yvel: target.yvel,
            gravity: target.gravity,
            hit: false,
            sprite: undefined
        };

        replay_log(replay_system, REPLAY_SPAWN, tick, copy_target);
    }
}

function anim_countdown(menu_system, score_system, tick, renderer) {
    renderer._ctx.setTransform(
        1, 0,
        0, 1,
        0, 0
    );

    renderer._ctx.font = "48px Pangolin";
    renderer._ctx.textAlign = 'center';
    renderer._ctx.textBaseline = 'top';
    renderer._ctx.fillStyle = "#492B0E";

    let s = Math.floor(tick / 60);
    let ms = Math.floor((tick % 60) / 60 * 100);

    if (s < 0)
        s = '00';
    else if (s < 10)
        s = '0' + s;

    if (ms < 0)
        ms = '00';
    else if (ms < 10)
        ms = '0' + ms;

    renderer._ctx.drawImage(menu_system.gamesign.tex, WIDTH / 4 - menu_system.gamesign.tex.width / 2, 0);
    renderer._ctx.fillText(s.toString() + ":" + ms.toString(), WIDTH / 4, 40);

    renderer._ctx.drawImage(menu_system.gamesign.tex, WIDTH / 4 * 3 - menu_system.gamesign.tex.width / 2, 0);
    renderer._ctx.fillText(score_system.total_score.toString(), WIDTH / 4 * 3, 40);
}

function anim_curtain_call(menu_system, tick, renderer) {
    if (tick < ANIM_CURTAIN_LENGTH) {
        let curtain_left = menu_system.curtain.curtain_left;
        let curtain_right = menu_system.curtain.curtain_right;
        let curtain_falling = menu_system.curtain.curtain_falling;

        renderer._ctx.setTransform(
            1, 0,
            0, 1,
            1, 1
        );

        let interp = Math.sin(tick / ANIM_CURTAIN_LENGTH * Math.PI);

        let end_left = 0;
        let end_right = WIDTH - curtain_right.width;
        let end_falling = 0;

        let start_left = -curtain_left.width;
        let start_right = WIDTH;
        let start_falling = -curtain_falling.height;

        let anim_left = start_left + (end_left - start_left) * interp;
        let anim_right = start_right + (end_right - start_right) * interp;
        let anim_falling = start_falling + (end_falling - start_falling) * interp;

        renderer._ctx.drawImage(curtain_falling, 0, anim_falling);
        renderer._ctx.drawImage(curtain_left, anim_left, 0);
        renderer._ctx.drawImage(curtain_right, anim_right, 0);
    }
}

function anim_falling_result_sign(menu_system, tick, score, renderer) {
    let sign = menu_system.score.sign;

    renderer._ctx.setTransform(
        1, 0,
        0, 1,
        1, 1
    );

    if (tick < 30) {
        let x = tick / 30;
        let interp = Math.sin(x * Math.PI / 2);

        let end_sign = 0;
        let start_sign = -sign.height;

        let anim_sign = start_sign + (end_sign - start_sign) * interp;

        renderer._ctx.drawImage(sign, 154, anim_sign);
    } else {
        let half_width = sign.width / 2;

        renderer._ctx.font = "48px Pangolin";
        renderer._ctx.textBaseline = 'top';
        renderer._ctx.fillStyle = "#492B0E";

        renderer._ctx.textAlign = 'center';
        renderer._ctx.drawImage(sign, 154, 0);
        renderer._ctx.fillText('Final Score', 154 + half_width, 300);
        renderer._ctx.fillText(score.toString(), 154 + half_width, 358);

        renderer._ctx.fillText('Retry', 154 + half_width / 2, 408);
        renderer._ctx.fillText('Playback', 154 + half_width / 2 * 3, 408);
    }
}

function anim_falling_menu_sign(menu_system, tick, renderer) {
    let sign = menu_system.score.sign;

    renderer._ctx.setTransform(
        1, 0,
        0, 1,
        1, 1
    );

    if (tick < 30) {
        let x = tick / 30;
        let interp = Math.sin(x * Math.PI / 2);

        let end_sign = 0;
        let start_sign = -sign.height;

        let anim_sign = start_sign + (end_sign - start_sign) * interp;

        renderer._ctx.drawImage(sign, 154, anim_sign);
    } else {
        let half_width = sign.width / 2;

        renderer._ctx.font = "48px Pangolin";
        renderer._ctx.textBaseline = 'top';
        renderer._ctx.fillStyle = "#492B0E";

        renderer._ctx.textAlign = 'center';
        renderer._ctx.drawImage(sign, 154, 0);
        renderer._ctx.fillText('Duck Shooter', 154 + half_width, 300);

        renderer._ctx.fillText('Play', 154 + half_width, 408);
    }
}

function game_play(game) {
    game.score_system.total_score = 0;
    game.replay_system.log.length = 0;
    game.replay_system.event_ptr = 0;
    game_reset(game);
    game_switch_state(game, GAME_STATE_MAIN);
}

function game_replay(game) {
    game.score_system.total_score = 0;
    game.replay_system.event_ptr = 0;
    game_reset(game);
    game_switch_state(game, GAME_STATE_REPLAY);
}

function game_reset(game) {
    game.particle_system.objects = [];
    game.target_system.objects = [];
    game.sprite_system.objects = [];
}

function game_switch_state(game, new_state) {
    game.tick = 0;
    game.state = new_state;
}

function game_main_update(game) {
    crosshair_update(game.crosshair_system, game.particle_system, game.target_system, game.score_system, game.replay_system, game.sprite_system, game.tick, true);
    particle_update(game.particle_system, game.sprite_system);
    target_update(game.target_system, game.sprite_system);
    director_update(game.target_system, game.sprite_system, game.replay_system, game.tick);

    if (game.tick == GAME_MAIN_LENGTH)
        game_switch_state(game, GAME_STATE_TRANSITION);
}

function game_main_render(game, renderer) {
    background_render(game.background_system, renderer);
    sprite_render(game.sprite_system, renderer);
    anim_countdown(game.menu_system, game.score_system, GAME_MAIN_LENGTH - game.tick, renderer);
    crosshair_render(game.crosshair_system, renderer);
}

function game_transition_update(game) {
    crosshair_update(game.crosshair_system, game.particle_system, game.target_system, game.score_system, game.replay_system, game.sprite_system, game.tick, false);
    particle_update(game.particle_system, game.sprite_system);
    target_update(game.target_system, game.sprite_system);

    if (game.tick == ANIM_CURTAIN_LENGTH / 2)
        game_reset(game);
    if (game.tick == ANIM_CURTAIN_LENGTH)
        game_switch_state(game, GAME_STATE_SCORE);
}

function game_transition_render(game, renderer) {
    background_render(game.background_system, renderer);
    sprite_render(game.sprite_system, renderer);
    anim_curtain_call(game.menu_system, game.tick, renderer);
    crosshair_render(game.crosshair_system, renderer);
}

function game_score_update(game) {
    if (game.crosshair_system.shoot) {
        let mx = game.crosshair_system.x;
        let my = game.crosshair_system.y;

        if (mx > 230 && mx < 410 &&
            my > 150 && my < 250)
            game_play(game);

        if (mx > 550 && mx < 730 &&
            my > 160 && my < 250)
            game_replay(game);
    }

    crosshair_update(game.crosshair_system, game.particle_system, game.target_system, game.score_system, game.replay_system, game.sprite_system, game.tick, false);
    particle_update(game.particle_system, game.sprite_system);
}

function game_score_render(game, renderer) {
    background_render(game.background_system, renderer);
    anim_falling_result_sign(game.menu_system, game.tick, game.score_system.total_score, renderer);
    sprite_render(game.sprite_system, renderer);
    crosshair_render(game.crosshair_system, renderer);
}

function game_replay_update(game) {
    let replay_system = game.replay_system;
    let event_now = replay_system.log[replay_system.event_ptr];

    if (game.tick >= event_now.tick) {
        switch (event_now.type) {
            case REPLAY_INPUT:
                game.crosshair_system.x = event_now.data.x;
                game.crosshair_system.y = event_now.data.y;
                game.crosshair_system.shoot = event_now.data.shoot;
                break;
            case REPLAY_SPAWN:
                {
                    let target = event_now.data;
                    let w = -target.xvel / Math.abs(target.xvel);
                    target_create(
                        game.target_system,
                        game.sprite_system,
                        target.type,
                        target.gravity,
                        target.x,
                        target.y,
                        target.xvel,
                        target.yvel,
                    );
                }
                break;
        }

        event_now = replay_system.log[replay_system.event_ptr++];
    }

    crosshair_update(game.crosshair_system, game.particle_system, game.target_system, game.score_system, game.replay_system, game.sprite_system, game.tick, true);
    particle_update(game.particle_system, game.sprite_system);
    target_update(game.target_system, game.sprite_system);

    if (game.tick == GAME_MAIN_LENGTH)
        game_switch_state(game, GAME_STATE_TRANSITION);
}

function game_menu_update(game) {
    if (game.crosshair_system.shoot) {
        let mx = game.crosshair_system.x;
        let my = game.crosshair_system.y;

        if (mx > 400 && mx < 560 &&
            my > 160 && my < 250) {
            game.background_system.music.cache[0].loop = true;
            play_sound(game.background_system.music);
            game_play(game);
        }
    }

    crosshair_update(game.crosshair_system, game.particle_system, game.target_system, game.score_system, game.replay_system, game.sprite_system, game.tick, false);
    particle_update(game.particle_system, game.sprite_system);
}

function game_menu_render(game, renderer) {
    background_render(game.background_system, renderer);
    anim_falling_menu_sign(game.menu_system, game.tick, renderer);
    sprite_render(game.sprite_system, renderer);
    crosshair_render(game.crosshair_system, renderer);
}

function loop(game, input, renderer, elapsed_time) {
    game.unprocessed_time += elapsed_time / 1000.0;

    while (game.unprocessed_time >= FRAME_TIME) {
        game.unprocessed_time -= FRAME_TIME;

        if (game.state != GAME_STATE_REPLAY)
            pump(game, input);

        switch (game.state) {
            case GAME_STATE_MAIN:
                game_main_update(game);
                break;
            case GAME_STATE_SCORE:
                game_score_update(game);
                break;
            case GAME_STATE_TRANSITION:
                game_transition_update(game);
                break;
            case GAME_STATE_REPLAY:
                game_replay_update(game);
                break;
            case GAME_STATE_MENU:
                game_menu_update(game);
                break;
        }

        game.tick++;
    }

    switch (game.state) {
        case GAME_STATE_REPLAY:
        case GAME_STATE_MAIN:
            game_main_render(game, renderer);
            break;
        case GAME_STATE_SCORE:
            game_score_render(game, renderer);
            break;
        case GAME_STATE_TRANSITION:
            game_transition_render(game, renderer);
            break;
        case GAME_STATE_MENU:
            game_menu_render(game, renderer);
            break;
    }
}

function main(assetlib) {
    let win = win_init();

    let input = win_create_input(win);
    let renderer = win_create_context(win);

    let game = game_create(assetlib);

    setTimeout(function() {}, 1000);

    let now_time;
    let prev_time = Date.now();

    let step = function() {
        let now_time = Date.now();
        let elapsed_time = now_time - prev_time;
        prev_time = now_time;

        loop(game, input, renderer, elapsed_time);

        window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
}

function asset_load() {
    let assetlib = [];

    let asset_count = 1;
    let finished_loading = function() {
        if (++asset_count == assetlib.length)
            main(assetlib);
    };

    let create_sprite = function(path) {
        let spr = new Image();
        spr.src = path;
        spr.onload = finished_loading;
        return spr;
    };

    let create_audio = function(path, cache_count) {
        let cache = [];
        for (let i = 0; i < cache_count; i++)
            cache.push(new Audio(path));

        finished_loading();

        return { cache: cache, cache_ptr: 0 };
    };

    assetlib.push(create_sprite("assets/bird1.png"));
    assetlib.push(create_sprite("assets/bird2.png"));
    assetlib.push(create_sprite("assets/bird3.png"));
    assetlib.push(create_sprite("assets/tinCan.png"));

    assetlib.push(create_sprite("assets/crosshair.png"));
    assetlib.push(create_sprite("assets/pow.png"));

    assetlib.push(create_sprite("assets/fallingCurtain.png"));
    assetlib.push(create_sprite("assets/leftCurtain.png"));
    assetlib.push(create_sprite("assets/rightCurtain.png"));

    assetlib.push(create_sprite("assets/fallingResultSign.png"));
    assetlib.push(create_sprite("assets/gameSign.png"));

    assetlib.push(create_sprite("assets/gameBackground.png"));

    assetlib.push(create_audio("assets/music.mp3", 2));
    assetlib.push(create_audio("assets/gunshot.mp3", 8));
    assetlib.push(create_audio("assets/tincan.mp3", 8));
    assetlib.push(create_audio("assets/quack.mp3", 8));
}

(function() {
    asset_load();
})();