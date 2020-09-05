/**Class for helper functions */
class Utils{

    /**
     * getLine() returns line number where the method was called, public
     * 
     * @return {Number}            [line number]
    */
    static getLine(offset) {
        const stack = new Error().stack.split('\n'),
            line = stack[(offset || 1) + 1].split(':');
        return parseInt(line[line.length - 2], 10);
    }

    /**
     * getFile() returns file name where the method was called, public
     * 
     * @return {String}            [file name]
    */
    static getFile(){
        return process.argv[1].split('/').slice(-1)[0];
    }
}

module.exports = Utils;