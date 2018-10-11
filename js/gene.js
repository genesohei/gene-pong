var Gene = window.Gene || {};

/**
 * Ядро
 *
 * @class Game
 * @constructor
 * @param {number} width - ширина холста
 * @param {number} height - высота холста
 * @param {string} parent - родительский элемент
 */
Gene.Game = function (width, height, parent) {
    /**
     * @property {number} width - ширина игрового поля
     */
    this.width = 640;

    /**
     * @property {number} height - высота игрового поля
     */
    this.height = 400;

    /**
     * @property {string} parent - родительский элемент
     */
    this.parent = '';

    /**
     * @property {HTMLCanvasElement} canvas - ссылка на объект canvas
     */
    this.canvas = null;

    /**
     * @property {CanvasRenderingContext2D} context - двухмерный контекст
     */
    this.context = null;

    /**
     * @property {Gene.Input} input - свойства и методы для работы с клавиатурой
     */
    this.input = null;

    /**
     * @property {Gene.Loader} load - свойства и методы для работы с изображениями
     */
    this.load = null;

    /**
     * @property {Gene.Pointer} pointer - свойства и методы для работы с мышью
     */
    this.pointer = null;

    /**
     * @property {Gene.Sound} sound - свойства и методы для работы со звуком
     */
    this.sound = null;

    /**
     * @property {Gene.Scale} scale - свойства и методы масштабирования игры
     */
    this.scale = null;

    /**
     * @property {Gene.Time} time - свойства и методы для управления временем
     */
    this.time = null;

    if (width) {
        this.width = width;
    }

    if (height) {
        this.height = height;
    }

    if (parent) {
        this.parent = parent;
    }
};

Gene.Game.prototype = {
    /**
     * Инициализация модулей
     */
    boot: function () {
        this.scale = new Gene.Scale(this);

        this.setUpRenderer();

        this.load = new Gene.Loader();
        this.time = new Gene.Time();
        this.input = new Gene.Input();
        this.pointer = new Gene.Pointer(this);
        this.sound = new Gene.Sound();

        this.time.boot();
    },

    /**
     * Установка параметров холста
     */
    setUpRenderer: function () {
        this.canvas = Gene.Canvas.create(this.width, this.height);

        this.context = this.canvas.getContext("2d");

        Gene.Canvas.addToDOM(this.canvas, this.parent);
    },

    /**
     * Рисование объекта "Прямоугольник"
     */
    drawRect: function (body, color) {
        if (color === undefined || color === null) {
            color = body.color;
        }

        this.context.fillStyle = color;
        this.context.fillRect(body.x, body.y, body.width, body.height);
    },

    /**
     * Рисование объекта "Текст"
     */
    drawText: function (body, text) {
        if (text === undefined || text === null) {
            text = body.text;
        } else {
            text = text.toString();
        }

        this.context.font = body.font;

        this.context.fillStyle = body.color;
        this.context.fillText(text, body.x, body.y);
    },

    /**
     * Запуск игры
     */
    start: function () {
        this.boot();

        this.create();

        this.context.textAlign = 'center';
        this.context.textBaseline = 'top';

        this.onLoop();
    },

    onLoop: function () {
        var that = this;

        this.time.tick(this.time.dt);

        this.update(this.time.dt);

        this.render();

        window.requestAnimationFrame(function () {
            that.onLoop(that);
        });
    }
};

Gene.Game.prototype.constructor = Gene.Game;

/**
 * Работа с курсором мыши
 *
 * @class Pointer
 * @constructor
 */
Gene.Pointer = function (game) {
    /**
     * @property {Gene.Game} game - ссылка на текущую игру
     */
    this.game = game;

    /**
     * @property {number} clientX - координата курсора относительно окна браузера по оси x
     */
    this.clientX = -1;

    /**
     * @property {number} clientY - координата курсора относительно окна браузера по оси y
     */
    this.clientY = -1;

    /**
     * @property {number} pageX - координата курсора относительно документа по оси x
     */
    this.pageX = -1;

    /**
     * @property {number} pageY - координата курсора относительно документа по оси y
     */
    this.pageY = -1;

    /**
     * @property {number} screenX - координата курсора относительно экрана по оси x
     */
    this.screenX = -1;

    /**
     * @property {number} screenY - координата курсора относительно экрана по оси y
     */
    this.screenY = -1;

    /**
     * @property {number} x - координата курсора по оси x
     */
    this.x = -1;

    /**
     * @property {number} y - координата курсора по оси y
     */
    this.y = -1;

    this.boot();
};

Gene.Pointer.prototype = {
    /**
     * Перемещение курсора
     */
    boot: function () {
        var that = this;

        window.onmousemove = function (e) {
            that.move(e);
        };
    },

    /**
     * Перемещение указателя мыши
     */
    move: function (event) {
        this.clientX = event.clientX;
        this.clientY = event.clientY;

        this.pageX = event.pageX;
        this.pageY = event.pageY;

        this.screenX = event.screenX;
        this.screenY = event.screenY;

        this.x = (this.pageX - this.game.canvas.offsetLeft);
        this.y = (this.pageY - this.game.canvas.offsetTop);
    }
};

Gene.Pointer.prototype.constructor = Gene.Pointer;

Gene.Input = function () {
    /**
     * @property {array} keyListeners- коллекция событий
     */
    this.keyListeners = [];
};

Gene.Input.prototype = {
    /**
     * Добавление пары: клавиша-событие
     */
    addKeyListener: function (keyAndListener) {
        this.keyListeners.push(keyAndListener);
    },

    /**
     * Поиск события по ключу
     */
    findKeyListener: function (key) {
        var listener;

        for (var i = 0; i < this.keyListeners.length; ++i) {
            var keyAndListener = this.keyListeners[i];
            var currentKey = keyAndListener.key;

            if (currentKey === key) {
                listener = keyAndListener.listener;
            }
        }

        return listener;
    },

    /**
     * Обработка событий: нажатие клавиши и ввод печатаемого символа
     */
    keyPressed: function (e) {
        var listener;
        var key;

        switch (e.keyCode) {
            case 32:
                key = 'space';
                break;
            case 37:
                key = 'left';
                break;
            case 39:
                key = 'right';
                break;
            case 38:
                key = 'up';
                break;
            case 40:
                key = 'down';
                break;
        }

        listener = this.findKeyListener(key);

        if (listener) {
            listener();
        }
    }
};

Gene.Input.prototype.constructor = Gene.Input;

/**
 * Загрузчик изображений
 */
Gene.Loader = function () {
    /**
     * @property {object} images - коллекция изображений
     */
    this.images = {};

    /**
     * @property {array} imageUrls - коллекция ссылок на изображения
     */
    this.imageUrls = [];

    /**
     * @property {number} imageLoaded - изображений загружено
     */
    this.imagesLoaded = 0;

    /**
     * @property {number} imagesFailedToLoad - изображений отклонено
     */
    this.imagesFailedToLoad = 0;

    /**
     * @property {number} imagesIndex - текущий индекс изображения
     */
    this.imagesIndex = 0;
};

Gene.Loader.prototype = {
    /**
     * Получение изображения по ссылке
     */
    getImage: function (imageUrl) {
        return this.images[imageUrl];
    },

    /**
     * Метод, вызываемый в loadImage() при успешной загрузке изображения
     */
    imageLoadedCallback: function () {
        this.imagesLoaded++;
    },

    /**
     * Метод, вызываемый в loadImage() при неудачной загрузке изображения
     */
    imageLoadErrorCallback: function () {
        this.imagesFailedToLoad++;
    },

    /**
     * Загрузка изображения
     */
    loadImage: function (imageUrl) {
        var that = this;
        var image = new Image();

        image.src = imageUrl;

        image.addEventListener('load', function (e) {
            that.imageLoadedCallback(e);
        });

        image.addEventListener('error', function (e) {
            that.imageLoadErrorCallback(e);
        });

        this.images[imageUrl] = image;
    },

    /**
     * Загрузка всех изображений
     */
    loadImages: function () {
        if (this.imagesIndex < this.imageUrls.length) {
            this.loadImage(this.imageUrls[this.imagesIndex]);
            this.imagesIndex++;
        }

        // количество загруженных изображений в процентах
        return (this.imagesLoaded + this.imagesFailedToLoad) / this.imageUrls.length * 100;
    },

    /**
     * Добавление изображения в очередь загрузки
     */
    queueImage: function (imageUrl) {
        this.imageUrls.push(imageUrl);
    }
};

Gene.Loader.prototype.constructor = Gene.Loader;

Gene.Scale = function (game) {
    var that = this;

    /**
     * @property {Gene.Game} game - ссылка на текущую игру
     */
    this.game = game;

    /**
     * @property {number} offsetX - смещение холста по горизонтали
     */
    this.offsetX = 0;

    /**
     * @property {number} offsetY - смещение холста по вертикали
     */
    this.offsetY = 0;

    /**
     * Изменение размера окна
     */
    window.onresize = function (e) {
        that.windowResize(e);
    };
};

Gene.Scale.prototype = {
    /**
     * Выравнивание хоста на странице
     *
     * @method Canvas#alignCanvas
     * @param {boolean} horizontal - Выравнивание по горизонтали
     * @param {boolean} vertical - Выравнивание по вертикали
     */
    alignCanvas: function (horizontal, vertical) {
        var canvas = this.game.canvas;

        var clientWidth = Math.max(window.innerWidth, document.documentElement.clientWidth);
        var clientHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);

        if (horizontal) {
            var offset = clientWidth / 2 - canvas.width / 2;
            canvas.style.marginLeft = offset + 'px';
        }

        if (vertical) {
            var offset = clientHeight / 2 - canvas.height / 2;
            canvas.style.marginTop = offset + 'px';
        }
    },

    windowResize: function () {
        this.offsetX = this.game.canvas.offsetLeft;
        this.offsetY = this.game.canvas.offsetTop;
    }
};

Gene.Scale.prototype.constructor = Gene.Scale;

Gene.Sound = function () {
    /**
     * @property {array} soundChannels - каналы звучания
     */
    this.soundChannels = [];

    /**
     * @property {Audio} audio - экземпляр объекта Audio
     */
    this.audio = new Audio();

    /**
     * @property {number} - допустимое количество каналов
     */
    this.NUM_SOUND_CHANNELS = 10;

    for (var i = 0; i < this.NUM_SOUND_CHANNELS; ++i) {
        var audio = new Audio();

        this.soundChannels.push(audio);
    }
};

Gene.Sound.prototype = {
    /**
     * Получение свободного канала для воспроизведения звука
     */
    getAvailableSoundChannel: function () {
        var audio;

        for (var i = 0; i < this.NUM_SOUND_CHANNELS; ++i) {
            audio = this.soundChannels[i];

            if (audio.played.length === 0 || audio.ended) {
                return audio;
            }
        }

        return undefined; // все каналы используются
    },

    /**
     * Воспроизведение звуковой дорожки
     */
    play: function (id) {
        var channel = this.getAvailableSoundChannel();
        var element = document.getElementById(id);

        if (channel && element) {
            channel.src = (element.src === '') ? element.currentSrc : element.src;
            channel.load();
            channel.play();
        }
    }
};

Gene.Sound.prototype.constructor = Gene.Sound;

/**
 * Прямоугольник
 *
 * @class Rect
 * @constructor
 * @param {number} x - Координата верхего левого угла прямоугольника по оси x
 * @param {number} y - Координата верхнего левого угла прямоугольника по оси y
 * @param {number} width - Ширина прямоугольника
 * @param {number} height - Высота прямоугольника
 * @param {string} color - Цвет прямоугольника
 */
Gene.Rect = function(x, y, width, height, color) {
    /**
     * @property {number} x - координата верхнего левого угла по оси x
     */
    this.x = x;

    /**
     * @property {number} y - координата верхнего левого угла по оси y
     */
    this.y = y;

    /**
     * @property {number} width - ширина прямоугольника
     */
    this.width = width;

    /**
     * @property {number} height - высота прямоугольника
     */
    this.height = height;

    /**
     * @property {string} color - цвет прямоугольника
     */
    this.color = color || 'rgb(255,255,255)';

    /**
     * @property {number} velocityX - скорость по оси x
     */
    this.velocityX = 0;

    /**
     * @property {number} velocityY - скорость по оси y
     */
    this.velocityY = 0;

    /**
     * @property {number} centerX - координата середины прямоугольника по оси x
     */
    this.centerX = x + width / 2;

    /**
     * @property {number} centerY - координата середины прямоугольника по оси y
     */
    this.centerY = y + height / 2;

    /**
     * @property {number} right - координата нижнего правого угла по оси x
     */
    this.right = x + width;

    /**
     * @property {number} bottom - координата нижнего правого угла по оси y
     */
    this.bottom = y + height;
};

Gene.Rect.prototype = {
    /**
     * Установка границ прямоугольника
     */
    setBounds: function () {
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;

        this.right = this.x + this.width;
        this.bottom = this.y + this.height;
    }
};

Gene.Rect.prototype.constructor = Gene.Rect;

/**
 * Текст
 *
 * @class Text
 * @constructor
 * @param {number} x - Координата по оси x
 * @param {number} y - Координата по оси y
 * @param {string} text - Строка для рисования
 * @param {string} font - Начертание, размер и семейство шрифта
 * @param {string} color - Цвет строки
 */
Gene.Text = function (x, y, text, font, color) {
    /**
     * @property {number} x - координата по оси x
     */
    this.x = x || 0;

    /**
     * @property {number} y - координата по оси y
     */
    this.y = y || 0;

    /**
     * @property {string} text - строка для рисования
     */
    this.text = text || '';

    /**
     * @property {string} font - начертание, размер и семейство шрифта в формате CSS
     */
    this.font = font || '14px Courier';

    /**
     * @property {string} color - цвет строки
     */
    this.color = color || 'rgb(255,255,255)';
};

Gene.Time = function () {
    /**
     * @property {number} startTime - время запуска игры
     */
    this.startTime = 0;

    /**
     * @property {number} lastTime - время последнего кадра
     */
    this.lastTime = 0;

    /**
     * @property {number} gameTime - время продолжительности игры в секундах
     */
    this.gameTime = 0;

    /**
     * @property {number} - time - разница между текущим и последним кадром
     */
    this.dt = 0;

    /**
     * @property {number} fps - кадров в секунду (текущее значение)
     */
    this.fps = 0;

    /**
     * @property {number} - кадров в секунду (по умолчанию)
     */
    this.STARTING_FPS = 60;

    /**
     * @property {boolean} paused - режим паузы
     */
    this.paused = false;

    /**
     * @property {number} startedPauseAt - время включения паузы
     */
    this.startedPauseAt = 0;

    /**
     * @property {number} PAUSE_TIMEOUT - интервал обновления в режиме паузы
     */
    this.PAUSE_TIMEOUT = 100;
};

Gene.Time.prototype = {
    /**
     * Метод вызываемый автоматически, при старте игры
     */
    boot: function () {
        this.startTime = this.getTimeNow();
    },

    /**
     * Получение объекта типа Date
     */
    getTimeNow: function () {
        return Date.now();
    },

    /**
     * Обновление частоты кадра и игрового времени
     */
    tick: function () {
        var now = this.getTimeNow();

        this.updateFrameRate(now);

        this.dt = (now - this.lastTime) / 1000.0;

        this.gameTime = (now - this.startTime) / 1000.0;

        this.lastTime = now;
    },

    /**
     * Определение количества кадров
     */
    updateFrameRate: function (time) {
        if (this.last === 0) {
            this.fps = this.STARTING_FPS;
        } else {
            this.fps = Math.round(1000 / (time - this.lastTime));
        }
    }
};

Gene.Time.prototype.constructor = Gene.Time;

Gene.Canvas = {
    /**
     * Создание элемента Canvas
     *
     * @method Canvas.create
     * @param {number} [width=256] - ширина холста
     * @param {number} [height=256] - высота холста
     * @return {HTMLCanvasElement} новый элемент Canvas
     */
    create: function (width, height) {
        width = width || 256;
        height = height || 256;

        var canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;
        canvas.style.display = 'block';

        return canvas;
    },

    /**
     * Вставка элемента Canvas в дерево документа
     *
     * @method Canvas.addToDOM
     * @param {HTMLCanvasElement} canvas
     * @param {string|HTMLElement} parent
     * @return {HTMLCanvasElement}
     */
    addToDOM: function (canvas, parent) {
        var target;

        target = document.getElementById(parent);

        if (!target) {
            target = document.body;
        }

        target.appendChild(canvas);

        return canvas;
    }
};