'use strict';

/**
 * This class helps simplify using SSML (Speech Synthesis Markup Language).
 * This only supports a subset of SSML tags which the Alexa device supports.
 * An example of how to use this class.
 * <code>
 *  var speech = new Speech();
 *  speech.say("Let's begin your lesson");
 *  speech.pause("1s");
 *
 * </code>
 * Implement a method for <phoneme/>, <w/>, <say-as> All done
 * interpret-as="cardinal|ordinal|digits|fraction|unit|date|time|telephone|address" + format="mdy|dmy|ymd|md|dm|ym|my|d|m|y" All done
 * @constructor
 */
function Speech() {
    this._elements = [];
}

/**
 * This appends raw text into the <speak/> tag.
 * @param saying The raw text to insert into the speak tag.
 * @returns {Speech}
 */
Speech.prototype.say = function (saying) {
    this._present(saying, "Die bereitgestellte Aussage für Speech#saying(..) war null oder undefined.");
    this._elements.push(this._escape(saying));
    return this;
};

/**
 * Creates and inserts a paragraph tag.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#p
 * @param paragraph The paragraph of text to insert.
 * @returns {Speech}
 */
Speech.prototype.paragraph = function (paragraph) {
    this._present(paragraph, "Der bereitgestellte Paragraph für Speech#paragraph(..) war null oder undefined.");
    this._elements.push("<p>" + this._escape(paragraph) + "</p>");
    return this;
};

/**
 * Creates and inserts a sentence tag.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#s
 * @param saying The sentence to insert.
 * @returns {Speech}
 */
Speech.prototype.sentence = function (saying) {
    this._present(saying, "Der bereitgestellte Satz fürSpeech#sentence(..) war null oder undefined.");
    this._elements.push("<s>" + this._escape(saying) + "</s>");
    return this;
};

/**
 * Creates and inserts a break tag. This method will also validate the break time conforms to the restrictions to Amazon Alexa.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#break
 * @param duration the duration represented by a number + either 's' for second or 'ms' for milliseconds.
 * @returns {Speech}
 */
Speech.prototype.pause = function (duration) {
    this._present(duration, "Die bereitgestellte Dauer für Speech#pause(..) war null oder undefined.");
    this._validateDuration(duration);
    this._elements.push("<break time='" + duration + "'/>");
    return this;
};

/**
 * Creates a break tag that will pause the audio based upon the strength provided.
 * For more information, please see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#break
 * @param strength such as none, x-weak, weak, medium, strong, x-strong
 * @returns {Speech}
 */
Speech.prototype.pauseByStrength = function (strength) {
    this._present(strength, "Die bereitgestellte Stärke für Speech#pauseByStrength(..) war null oder undefined");
    strength = strength.toLowerCase().trim();
    var strengths = ['none', 'x-weak', 'weak', 'medium', 'strong', 'x-strong'];
    isInList(strength, strengths, "Die bereitgestellte Stärke für Speech#pauseByStrength(..) ist nicht gültig. Bereitgestellte Stärke: " + strength);

    this._elements.push("<break strength='" + strength + "'/>");
    return this;
};

/**
 * Creates and inserts an audio tag.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#audio
 * @param url a link to an audio file to play.
 * @param callback - an optional callback which is called to build the nested SSML
 *                   for the audio tag. The callback takes a single parameter of type
 *                   Speech.
 * @returns {Speech}
 */
 Speech.prototype.audio = function (url, callback) {
     this._present(url, "Die bereitgestellte URL für Speech#audio(..) war null oder undefined.");
     if(callback){
       this._isFunction(callback, "callback");
       var audioBuilder = new Speech();
       callback(audioBuilder);
       this._elements.push("<audio src='" + url + "'>" + audioBuilder.ssml(true) + "</audio>");
     }else{
       this._elements.push("<audio src='" + url + "'/>");
     }
     return this;
 };


/**
 * Creates and inserts a say-as tag.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#say-as
 * @param word word or text to insert
 * @returns {Speech}
 */
Speech.prototype.spell = function (word) {
    this._present(word, "Das bereitgestellte Wort für Speech#spell(..) war null oder undefined.");
    this._elements.push("<say-as interpret-as='spell-out'>" + this._escape(word) + "</say-as>");
    return this;
};

/**
 * Creates and inserts a say-as tag.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#say-as
 * @param word word or text to insert , delay the delay represented by a number + either 's' for second or 'ms' for milliseconds.
 * @returns {Speech}
 */
Speech.prototype.spellSlowly = function (word, delay) {
    this._present(word, "Das bereitgestellte Wort für Speech#spellSlowly(..) war null oder undefined.");
    for (var i = 0; i < word.length; i++) {
        this._elements.push("<say-as interpret-as='spell-out'>" + this._escape(word.charAt(i)) + "</say-as>");
        this.pause(delay);
    }
    return this;
};

/**
 * This constructs an object that the AlexaSkill.js accepts to send to the user.
 * @returns {{type: string, speech}}
 */
Speech.prototype.toObject = function () {
    return {
        type: 'SSML',
        speech: this.ssml()
    }
};

/**
 * This method will construct an SSML xml string.
 * @param excludeSpeakTag when true, no root tag <speak/> is provided; otherwise,
 *        the content is surrounded by the <speak/>, default is false
 * @returns {string} An XML string.
 */
Speech.prototype.ssml = function (excludeSpeakTag) {
    if (excludeSpeakTag) {
        return this._elements.join(" ");
    }
    return "<speak>" + this._elements.join(" ") + "</speak>";
};

/**
 * Validates that the provided value is not null or undefined. It will throw an exception if it's either.
 * @param value The value to check.
 * @param msg The error message stating that exception.
 * @private
 */
Speech.prototype._present = function (value, msg) {
    if (value === null || value === undefined) {
        throw msg;
    }
};

/**
 * This validates that a duration is in the correct format and doesn't exceed the
 * maximum duration of 10 seconds or 10000 milliseconds.
 *
 * The expected format is a positive number followed by 's' for second or 'ms' for milliseconds.
 *
 * @param duration The duration of a pause.
 * @throws an exception when the duration doesn't conform to the proper format or duration length.
 * @private
 */
Speech.prototype._validateDuration = function (duration) {
    var re = /^(\d*\.?\d+)(s|ms)$/;
    if (duration.match(re)) {
        var parts = re.exec(duration);
        var pauseDuration = parts[1];
        var pauseType = parts[2];
        if (pauseType.toLowerCase() === 's' && pauseDuration > 10) {
            throw "Die Pausendauer überschreitet die zulässige Dauer von 10 Sekunden. Bereitgestellte Dauer: " + duration;
        } else if (pauseDuration > 10000) {
            throw "Die Pausendauer überschreitet die zulässige Dauer von 10.000 Millisekunden. Bereitgestellte Dauer: " + duration;
        }
    } else {
        throw "Die Dauer muss eine Zahl sein, gefolgt von 's' für die zweite oder 'ms' für Millisekunden, zum Beispiel 10s oder 100ms. Maximale Dauer beträgt 10 Sekunden (10000 Millisekunden)."
    }
};

/**
 * Creates and inserts a say-as tag that has multiple attributes such as interpret-as and format
 * interpret-as="characters|spell-out|cardinal|number|ordinal|digits|fraction|unit|date|time|telephone|address|interjection|expletive" + format="mdy|dmy|ymd|md|dm|ym|my|d|m|y"
 *
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#say-as
 * @param options an object that has three properties: word, interpret and format
 * word being the text to insert, interpret represents the attribute interpret-as and format represents the attribute format
 * @returns {Speech}
 */
Speech.prototype.sayAs = function (options) {
    this._present(options, "Das bereitgestellte Object für Speech#sayAs(..) war ungültig.");
    this._present(options.word, "Das bereitgestellte Wort für Speech#sayAs(..) war null or undefined.");
    if (options.interpret) {
        var listOfInterpret = ['characters', 'spell-out', 'cardinal', 'number', 'ordinal', 'digits', 'fraction', 'unit', 'date', 'time', 'telephone', 'address', 'interjection', 'expletive'];
        isInList(options.interpret, listOfInterpret, "Der Interpret ist ungültig. Ich habe folgendes erhalten: " + options.interpret);
        if (options.format) {
            this._elements.push("<say-as interpret-as=\'" + options.interpret + "\'" + " format=\'" + options.format + "'>" + options.word + "</say-as>");
            return this;
        }
        this._elements.push("<say-as interpret-as=\'" + options.interpret + "'>" + options.word + "</say-as>");
        return this;
    } else {
        this._elements.push(options.word);
        return this;
    }
};

/**
 * Creates and inserts a w tag that customizes the pronunciation of words by specifying the word’s part of speech
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#w
 * @param options an object that has two properties: word and role
 * word being the text to insert and role represents the part of speech
 * @returns {Speech}
 */
Speech.prototype.partOfSpeech = function (options) {
    this._present(options, "Das bereitgestellte Object für Speech#partOfSpeech(..) war ungültig.");
    this._present(options.word, "Das bereitgestellte Wort für Speech#partOfSpeech(..) war null oder undefined.");
    var word = this._escape(options.word);
    if (options.role) {
        this._elements.push("<w role=\'" + options.role + "'>" + word + "</w>")
    }
    return this;
};

/**
 * Creates and inserts a phoneme tag.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#phoneme
 * @param alphabet, ph, word
 * alphabet i.e "ipa"
 * ph i.e "pɪˈkɑːn"
 * word being the text to insert
 * @returns {Speech}
 */
Speech.prototype.phoneme = function (alphabet, ph, word) {
    this._present(alphabet, "Das bereitgestellte Alphabet für Speech#phoneme(..) war null oder undefined.");
    this._present(ph, "Das bereitgestellte ph für Speech#phoneme(..) war null oder undefined.");
    this._present(word, "Das bereitgestellte Wort für Speech#phoneme(..) war null oder undefined.");
    var escapedWord = this._escape(word);
    if (ph.indexOf("'") !== -1) {
        ph = ph.replace(/'/g, '&apos;')
    }
    this._elements.push("<phoneme alphabet=\'" + alphabet + "\'" + " ph=\'" + ph + "'>" + escapedWord + "</phoneme>");
    return this;
};

/**
 * This method escapes any special characters that will cause SSML to be invalid.
 * @param word being the text to insert
 * @returns {*}
 * @private
 */
Speech.prototype._escape = function (word) {
    if (typeof(word) === "string") {
        word = word.replace(/&/g, 'und');
        word = word.replace(/</g, '');
        word = word.replace(/>/g, '');
        word = word.replace(/"/g, '');
        word = word.replace(/'/g, '');
        return word;
    }
    if (typeof(word) === "number") {
        return word;
    }
    if (typeof(word) === "boolean") {
        return word;
    }
    throw new Error('received invalid type ' + typeof(word));
};

/**
 * This method ensures the input passing in is not null, undefined or empty string. In the case that it is, an exception is thrown with the message provided.
 * @param word
 * @param msg
 * @private
 */
Speech.prototype._notEmpty = function (word, msg) {
    this._present(word, msg);
    if (word.length === 0) {
        throw msg;
    }
};

/**
 * Ensures 'fnc' is a function.
 * @param fnc the variable to check if it's a function.
 * @param name the name of the parameter used in the error message.
 */
Speech.prototype._isFunction = function (fnc, name) {
    var fncType = typeof(fnc);
    if(fncType !== "function"){
        throw new Error(name + " was not a function. received: " + fncType);
    }
};

/**
 * Creates and inserts a emphasis tag.
 * see https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#emphasis
 * @param level includes strong, moderate and reduced
 * @param word word or text to insert
 * @returns {Speech}
 */
Speech.prototype.emphasis = function (level, word) {
    this._present(level, "Das bereitgestellte Level für Speech#emphasis(..) war null oder undefined");
    this._present(word, "Das bereitgestellte Wort für Speech#emphasis(..) war null oder undefined");
    var levels = ['strong', 'moderate', 'reduced'];
    if (levels.indexOf(level) < 0) {
        throw new Error("Das bereitgestellte Level für Speech#emphasis(..) war nicht gültig. Erhaltenes Level: " + level);
    }

    this._notEmpty(word, "Das bereitgestellte Wort für Speech#emphasis(..) war leer.");
    this._elements.push("<emphasis level='" + level + "'>" + this._escape(word) + "</emphasis>");
    return this;
};

/**
 * √ TODO: Handle rate minimum 20%
 * @param attributes
 * @param word
 * @returns {Speech}
 */
Speech.prototype.prosody = function (attributes, word) {
    this._present(attributes, "Die bereitgestellten Attribute für Speech#prosody(..) ware null oder undefined");
    this._present(word, "Das bereitgestellte Wort für Speech#prosody(..) war null oder undefined");
    this._notEmpty(word, "Das bereitgestellte Wort für Speech#prosody(..) war leer");

    var validRates = ['x-slow', 'slow', 'medium', 'fast', 'x-fast'];
    var validPitches = ['x-low', 'low', 'medium', 'high', 'x-high'];
    var validVolumes = ['silent', 'x-soft', 'soft', 'medium', 'loud', 'x-loud'];

    var final = "<prosody";

    validateAttribute(attributes, 'rate', validRates, function () {
        if (!/\d+%/.test(attributes.rate)) {
            throw new Error("attributes.rate is not a valid rate");
        }
        checkRateRange(attributes.rate);
    }, function () {
        final += " rate='" + attributes.rate + "'";
    });

    validateAttribute(attributes, 'pitch', validPitches, function () {
        if (!/(\+|-)\d+(\.\d+)?%/.test(attributes.pitch)) {
            throw new Error("attributes.pitch is not a valid pitch");
        }
    }, function () {
        final += " pitch='" + attributes.pitch + "'";
    });

    validateAttribute(attributes, 'volume', validVolumes, function () {
        if (!/(\+|-)\d+(\.\d+)?db/.test(attributes.volume)) {
            throw new Error("attributes.volume is not a valid volume");
        }
        var length = attributes.volume.length;
        var firstHalf = attributes.volume.substring(0, length - 2);
        firstHalf += "dB";
        attributes.volume = firstHalf;
    }, function () {
        final += " volume='" + attributes.volume + "'";
    });

    final += ">" + this._escape(word) + "</prosody>";
    this._elements.push(final);
    return this;

};

/**
 * This helper function consolidates the validation checks for rate,pitch and volume. It will first
 * check to see if the attribute is present and whether it's one of the following conditions:
 *  a) the value of the attribute is a valid value or
 *  b) the value does not exist in the list, but passes the onCheck function. A hook for additional checks.
 *
 *  Upon passing the above checks, the onSuccessful function is called allowing the caller to do any additional work.
 *
 * @param obj The object that owns the attribute.
 * @param attribute The attribute name to check. e.g., rate, pitch or volume.
 * @param validList The list of value values that the attribute can be.
 * @param onCheck A hook for additional checks if the value does not exist in the list.
 * @param onSuccessful A hook to call when all validation checks succeed.
 */
function validateAttribute(obj, attribute, validList, onCheck, onSuccessful) {
    if (obj.hasOwnProperty(attribute)) {
        obj[attribute] = obj[attribute].toLowerCase().trim();
        if (validList.indexOf(obj[attribute]) == -1) {
            onCheck();
        }
        onSuccessful();
    }
}

/**
 * This method ensures that the value of the rate must be equal or great than 20%
 * @param num is the value of rate
 */
function checkRateRange(num) {
    var numString = num.substring(0, num.length - 1);
    var parseNum = parseInt(numString);
    if (parseNum < 20) {
        throw new Error("The minimum rate is twenty percentage. Received: " + parseNum);
    }
}

/**
 * This method lets the user provide an alias and pronounce the specified word or pharse as a different word or phrase
 * @param alias is the word that you want to pronounce instead of the original word
 * @param word
 * @returns {Speech}
 */
Speech.prototype.sub = function (alias, word) {
    this._present(alias, "Der bereitgestellte Alias für Speech#sub(..) war null oder undefined");
    this._notEmpty(alias, "Der bereitgestellte Alias für Speech#sub(..) war leer");
    this._present(word, "Das bereitgestellte Wort für Speech#sub(..) war null oder undefined");
    this._notEmpty(word, "Das bereitgestellte Wort für Speech#sub(..) war leer");

    this._elements.push("<sub alias='" + alias + "'>" + this._escape(word) + "</sub>");
    return this;
};

/**
 * This method validates if the value exists in the list of values
 * @param value
 * @param listOfValues
 * @param msg is the error message that will be thrown when the value is not in the list
 */
function isInList(value, listOfValues, msg) {
    value = value.toLowerCase().trim();
    if (listOfValues.indexOf(value) === -1) {
        throw new Error(msg);
    }
}

module.exports = Speech;
