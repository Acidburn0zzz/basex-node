/*global Buffer require exports console setTimeout */

// TODO - incorporate these V8 pro tips:
//    pre-allocate Arrays if length is known in advance
//    do not use delete
//    use numbers for parser state

var events = require("events"),
    util = require("util");

exports.debug_mode = false;
exports.name = "javascript";

function BasexReplyParser(options) {
    this.name = exports.name;
    this.options = options || {};
    console.log("options",options);
    this.reset();
    events.EventEmitter.call(this);
}

util.inherits(BasexReplyParser, events.EventEmitter);

exports.Parser = BasexReplyParser;

// Buffer.toString() is quite slow for small strings
function small_toString(buf, len) {
    var tmp = "", i;

    for (i = 0; i < len; i += 1) {
        tmp += String.fromCharCode(buf[i]);
    }

    return tmp;
}

// Reset parser to it's original state.
BasexReplyParser.prototype.reset = function () {
    
    this.return_buffer = new Buffer(16384); // for holding replies, might grow
    this.return_string = "";
    this.tmp_string = ""; // for holding size fields

    this.states = {
           
            SINGLE_LINE: 1
            ,MULTI_BULK_COUNT: 2
            ,FINAL_LF:3
        };
        
        this.state = this.states.SINGLE_LINE;
};

BasexReplyParser.prototype.parser_error = function (message) {
    this.emit("error", message);
    this.reset();
};
BasexReplyParser.prototype.execute = function (incoming_buf) {
    var pos = 0, bd_tmp, bd_str, i, il, states = this.states;
    //, state_times = {}, start_execute = new Date(), start_switch, end_switch, old_state;
    //start_switch = new Date();

    while (pos < incoming_buf.length) {
        // old_state = this.state;
        // console.log("execute: " + this.state + ", " + pos + "/" + incoming_buf.length + ", " + String.fromCharCode(incoming_buf[pos]));

        switch (this.state) {
        
      
        case states.SINGLE_LINE:
            if (incoming_buf[pos] === 0) {
                this.send_reply(this.return_string);
                this.state = states.FINAL_LF;
            } else {
                this.return_string += String.fromCharCode(incoming_buf[pos]);
            }
            pos += 1;
            break;
            
        case states.FINAL_LF:
        	
        default:
            this.parser_error(new Error("invalid state " + this.state));
        }
        // end_switch = new Date();
        // if (state_times[old_state] === undefined) {
        // state_times[old_state] = 0;
        // }
        // state_times[old_state] += (end_switch - start_switch);
        // start_switch = end_switch;
    }
    // console.log("execute ran for " + (Date.now() - start_execute) + " ms, on " + incoming_buf.length + " Bytes. ");
    // Object.keys(state_times).forEach(function (state) {
    // console.log(" " + state + ": " + state_times[state]);
    // });
};

BasexReplyParser.prototype.send_error = function (reply) {
    if (this.multi_bulk_length > 0 || this.multi_bulk_nested_length > 0) {
        // TODO - can this happen?  Seems like maybe not.
        this.add_multi_bulk_reply(reply);
    } else {
        this.emit("reply error", reply);
    }
};

BasexReplyParser.prototype.send_reply = function (reply) {
    if (this.multi_bulk_length > 0 || this.multi_bulk_nested_length > 0) {
        if (!this.options.return_buffers && Buffer.isBuffer(reply)) {
            this.add_multi_bulk_reply(reply.toString("utf8"));
        } else {
            this.add_multi_bulk_reply(reply);
        }
    } else {
        if (!this.options.return_buffers && Buffer.isBuffer(reply)) {
            this.emit("reply", reply.toString("utf8"));
        } else {
            this.emit("reply", reply);
        }
    }
};

BasexReplyParser.prototype.add_multi_bulk_reply = function (reply) {
    if (this.multi_bulk_replies) {
        this.multi_bulk_replies[this.multi_bulk_pos] = reply;
        this.multi_bulk_pos += 1;
        if (this.multi_bulk_pos < this.multi_bulk_length) {
            return;
        }
    } else {
        this.multi_bulk_replies = reply;
    }

    if (this.multi_bulk_nested_length > 0) {
        this.multi_bulk_nested_replies[this.multi_bulk_nested_pos] = this.multi_bulk_replies;
        this.multi_bulk_nested_pos += 1;

        this.multi_bulk_length = 0;
        this.multi_bulk_replies = null;
        this.multi_bulk_pos = 0;

        if (this.multi_bulk_nested_length === this.multi_bulk_nested_pos) {
            this.emit("reply", this.multi_bulk_nested_replies);
            this.multi_bulk_nested_length = 0;
            this.multi_bulk_nested_pos = 0;
            this.multi_bulk_nested_replies = null;
        }
    } else {
        this.emit("reply", this.multi_bulk_replies);
        this.multi_bulk_length = 0;
        this.multi_bulk_replies = null;
        this.multi_bulk_pos = 0;
    }
};