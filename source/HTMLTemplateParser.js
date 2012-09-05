function parseHTMLTemplate(str){
    var input = "";
    var EOF = {};

    var state = data;

    var errors = [];
    var commands = [];
    var output = function(){
        for(var i =0;i<arguments.length;i++)
            commands.push({command:arguments[i],param:text});
        text = "";
    }

    var isEndTag = false;


    
    var text = "";


    function consumeCharacterReference(additionalAllowedCharacter){
        var c = input[i];
        if(c=="\t"||c=="\n"||c=="\f"||c==" "||c=="<"||c=="&"||c==EOF||c==additionalAllowedCharacter) {
            return;
        }
        if(c=="#") {
            c = consume(1);
            var range = /[0-9]/;
            var num = [];
            var n = 10;
            
            if(c=="x"||c=="X") {
                c = consume(1);
                range = /[a-fA-F0-9]/;
                n = 16;
            }
            
            while(c.match(range)) {
                num.push(c);
                c=consume(1)
            }
            if(c==";")
                consume(1);
            
            return String.fromCharCode(parseInt(num.join(""),n));
        }
    }
    function unconsume(n) {
        i-=n;
        return input[i];
    }
    function consume(n) {
        i+=n;
        return input[i];
    }
    function next(n) {
        if(i+n>input.length)
            return input.slice(i,input.length-i);
        input.slice(i,n);
    }
    function error(){
    }
    function _assert(flag) {
        if(!flag)
            debugger;
    }
    var data = function(c){
        if(c=="&") {
            c = consumeCharacterReference();
            if(c) {
                if(text) 
                    text += c;
                else {
                    text = c;
                }
            }
            else {
                if(text) 
                    text += "&";
                else {
                    text = "&";
                }
            }
                
            return data;
        }
        else if(c=="<") {
            output("text");
            return tagOpen;
        }
        else if(c=="\0") {
            error();
        }
        else if(c=="$") {
            return afterDollarInText;            
        }
        else if(c==EOF) {
            output("text");
        }
        else {
            if(text) 
                text += c;
            else {
                text = c;
            }
            return data;
        }
    };

    var tagOpen = function(c){
        isEndTag = false;
        if(c=="!") {
            error();
        }
        else if(c=="/") {
            isEndTag = true;
            return endTagOpen;
        }
        else if(c.match(/[$a-zA-Z0-9]/)) {
            text = c.toLowerCase();
            return tagName;
        }
        else if(c=="?") {
            error();
        }
        else {
            error();
            return data("<");
        }
    };


    var endTagOpen = function(c){
    
        if(c.match(/[$a-zA-Z0-9]/)) {
            text = c.toLowerCase();
            return tagName;
        }
        else if(c==">") {
            error();
            return data;
        }
        else if(c==EOF) {
            error();
            data("<");
            data("/");
            return data(EOF);
        }
        else {
            
        }
    };
    var tagName = function(c){
        if(c=="\n"||c=="\f"||c=="\t"||c==" ") {
            if(isEndTag) {
                output("tagEnd");
            } else {
                output("tagStart");
            }
            return beforeAttributeName;
        }
        else if(c=="/") {
            output("tagStart");
            return selfclosingStartTag;
        }
        else if(c==">") {
            if(isEndTag) {
                output("tagEnd");
            }
            else {
                output("tagStart");
            }
            return data;
        }
        else if(c.match(/[$a-zA-Z0-9]/)) {
            text += c.toLowerCase();
            return tagName;
        }
        else if(c=="\0") {
            error();
            text += "\uFFFD";
            return tagName;
        }
        else if(c==EOF) {
            error();
            return data(EOF);
        }
        else {
            return tagName;
        }
    };

    var beforeAttributeName = function(c){
        if(c=="\n"||c=="\f"||c=="\t"||c==" ") {
            return beforeAttributeName;
        }
        else if(c=="/") {
            return selfclosingStartTag;
        }
        else if(c==">") {
            return data;
        }
        else if(c.match(/[@a-zA-Z0-9]/)) {
            if(text)
                text += c;
            else
                text = c;
            return attributeName;
        }
        else if(c=="\0") {
            return data;
        }
        else if(c=="\""||c=="\'"||c=="<"||c=="=") {
            return data;
        }
        else if(c==EOF) {
            return data(EOF);
        }
        else {
            return attributeName;
        }
    };
    var attributeName = function(c){
        if(c=="\n"||c=="\f"||c=="\t"||c==" ") {
            output("attributeName");
            return afterAttributeName;
        }
        else if(c=="/") {
            output("attributeName");
            return selfclosingStartTag;
        }
        else if(c=="=") {
            output("attributeName");
            return beforeAttributeValue;
        }
        else if(c==">") {
            output("attributeName");
            return data;
        }
        else if(c.match(/[@a-zA-Z0-9]/)) {
            if(text)
                text += c;
            else
                text = c;
            return attributeName;
        }
        else if(c=="\0") {
            error();
            if(text)
                text += "\uFFFD";
            else
                text = "\uFFFD";
            return attributeName;
        }
        else if(c=="\""||c=="\'"||c=="<") {
            error();
            if(text)
                text += c;
            else
                text = c;
            return attributeName;
        }
        else if(c==EOF) {
            error();
            return data(EOF);
        }        
        else {
            if(text)
                text += c;
            else
                text = c;
            return attributeName;
        }
    };
    var afterAttributeName = function(c){
        if(c=="\n"||c=="\f"||c=="\t"||c==" ") {
            return afterAttributeName;
        }
        else if(c=="/") {
            return selfclosingStartTag;
        }
        else if(c=="=") {            
            return beforeAttributeName;
        }
        else if(c==">") {
            return data;
        }
        else if(c.match(/[@a-zA-Z0-9]/)) {
            text = c;
            return attributeName;
        }
        else if(c=="\0") {
            error();
            text = "\uFFFD";
            return attributeName;
        }
        else if(c=="\""||c=="\'"||c=="<") {
            error();
            text = c;
            return attributeName;
        }
        else if(c==EOF) {
            error();
            return data(EOF);
        }        
        else {
            text = c;
            return attributeName;
        }
    };
    var beforeAttributeValue = function(c){
        if(c=="\n"||c=="\f"||c=="\t"||c==" ") {
            return afterAttributeName;
        }
        else if(c=="\"") {
            return attributeValueDQ;
        }
        else if(c=="&") {
            return attributeValueUQ(c);
        }
        else if(c=="'") {
            return attributeValueSQ;
        }
        else if(c=="\0") {
            error();
            text += "\uFFFD";
            return attributeValueUQ;
        }
        else if(c==">") {
            error();
            return data;
        }
        else if(c=="`"||c=="<"||c=="=") {
            error();
            return attributeName;
        }
        else if(c==EOF) {
            error();
            return data(EOF);
        }        
        else {
            text = c;
            return attributeValueUQ;
        }
    };
    var attributeValueDQ = function(c){
        if(c=="\"") {
            output("attributeValue");
            return afterAttributeValueQ;
        }
        else if(c=="$") {
            return afterDollarInAttributeValueDQ;
        }
        else if(c=="&") {
            var c = consumeCharacterReference("\"");
            if(!c)
                text += "&";
            else
                text += c;
            return attributeValueDQ;
        }
        else if(c=="\0") {
            error();
            text += "\uFFFD";
            return attributeValueUQ;
        }
        else if(c==EOF) {
            error();
            return data(EOF);
        }        
        else {
            if(!text)
                text = c;
            else
                text += c;
            return attributeValueDQ;
        }
    };
    var attributeValueSQ = function(c){
        if(c=="\'") {
            output("attributeValue");
            return afterAttributeValue;
        }
        else if(c=="$") {
            return afterDollarInAttributeValueSQ;
        }
        else if(c=="&") {
            var c = consumeCharacterReference("\'");
            if(!c)
                text += "&";
            else
                text += c;
            return attributeValueUQ;
        }
        else if(c=="\0") {
            error();
            text += "\uFFFD";
            return attributeValueUQ;
        }
        else if(c==EOF) {
            error();
            return data(EOF);
        }        
        else {
            if(!text)
                text = c;
            else
                text += c;
            return attributeValueSQ;
        }
    };
    var attributeValueUQ = function(c){
        if(c=="\n"||c=="\f"||c=="\t"||c==" ") {
            output("attributeValue")
            return beforeAttributeName;
        }
        else if(c=="$") {
            return afterDollarInAttributeValueUQ;
        }
        else if(c=="&") {
            consumeCharacterReference(">");
            return attributeValueUQ;
        }
        else if(c=="\0") {
            error();
            text += "\uFFFD";
            return attributeValueUQ;
        }
        else if(c=="\""||c=="'"||c=="<"||c=="="||c=="`") {
            error();
            text += c;            
            return attributeValueUQ;
        }
        else if(c==EOF) {
            return data(EOF);
        }        
        else {
            if(!text)
                text = c;
            else
                text += c;
            return attributeValueUQ;
        }
    };
    var afterAttributeValueQ = function(c){
        if(c=="\n"||c=="\f"||c=="\t"||c==" ") {
            return beforeAttributeName;
        }
        else if(c=="/") {
            return selfclosingStartTag;
        }
        else if(c==">") {
            return data;
        }
        else if(c==EOF) {
            return data(EOF);
        }
        else {
            error();
            return beforeAttributeName(c);
        }
    };
    var selfclosingStartTag = function(c){
        output("tagEnd");
        if(c==">") {
            return data;
        }
        else if(c==EOF) {
            error();
            return data(EOF);
        }
        else {
            error();
            return beforeAttributeName(c);
        }
    };
    var afterDollarInText = function(c) {
        if(c=="{") {
            output("text");
            return parameterInText;
        }
        else {
            //TODO:
        }
    };
    var parameterInText = function(c) {
        if(c=="}") {
            output("parameter");
            return data;
        }
        else {
            text += c;
            return parameterInText;
        }
    }
    var afterDollarInAttributeValueDQ = function(c) {
        if(c=="{") {
            output("attributeValue");
            return parameterInAttributeValueDQ
        }
        else {
            //TODO:
        }
    }
    var afterDollarInAttributeValueSQ = function(c) {
        if(c=="{") {
            output("attributeValue");
            return parameterInAttributeValueSQ
        }
        else {
            //TODO:
        }
    }
    var afterDollarInAttributeValueUQ = function(c) {
        if(c=="{") {
            output("attributeValue");
            return parameterInAttributeValueUQ
        }
        else {
            //TODO:
        }
    }
    var parameterInAttributeValueDQ = function(c) {
        if(c=="}") {
            output("parameter");
            return attributeValueDQ;
        }
        else {
            if(text==="")
                text = c;
            else
                text += c;
            return parameterInAttributeValueDQ;
        }
    }
    var parameterInAttributeValueSQ = function(c) {
        if(c=="}") {
            output("parameter");
            return attributeValueSQ;
        }
        else {
            text += c;
            return parameterInAttributeValueSQ;
        }
    }
    var parameterInAttributeValueUQ = function(c) {
        if(c=="}") {
            output("parameter");
            return attributeValueUQ;
        }
        else {
            text += c;
            return parameterInAttributeValueUQ;
        }
    }
    
    input = str.split("");
    input.push(EOF);
        
    state = data;        

                      
    i = 0;
    while(i<input.length) {
        state = state(input[i++]);            
    }
    return commands;
}
