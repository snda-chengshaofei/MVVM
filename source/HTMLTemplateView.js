function PropertyBinding(element,prop) {
    var parts = [];
    var obj = null;
    this.update = function(o){
        obj = o;

        var props = prop.split(".");
        var ele = element;
        for(var i = 0; i < props.length-1; i++)
            ele = ele[props[i]];
        ele[props[props.length-1]] = parts.length==1?parts[0].valueOf():parts.join("");
    }
    this.appendText = function(text) {
        if(!text || text.length==0)
            return;
        parts.push(text);
    }
    this.appendParameter = function(name){
        parts.push({valueOf:function(){return obj[name]},toString:function(){return obj[name]}});
    }
}
function AttributeBinding(attr) {
    var parts = [];
    var obj = null;
    this.update = function(o){
        obj = o;
        attr.value = parts.join("");
    }
    this.appendText = function(text) {
        if(!text || text.length==0)
            return;
        parts.push(text);
    }
    this.appendParameter = function(name){
        parts.push({valueOf:function(){return obj[name]},toString:function(){return obj[name]}});
    }
}
function TextBinding(node) {
    var parts = [];
    this.update = function(o){
        obj = o;
        node.textContent = parts.join("");
    }
    this.appendText = function(text) {
        if(text.length==0)
            return;
        parts.push(text);
    }
    this.appendParameter = function(name){
        parts.push({toString:function(){return obj[name]}});
    }
}
function HTMLTemplateListView(template){


    var root = document.createElement("ul");
    var data = null
    var commands = null;


    Object.defineProperty(root,"data",{
        set:function(v){
            data = v;
            if(commands) {
                if(contents)
                    update();
                else
                    rebuild();
            }
        },
        get:function(v){
            return data;
        }
    })

    root.classList.add("list-view");

    root.setTemplate = function(template){
        if(typeof template != "object" || Object.prototype.toString.call(template) != "[object Array]")
            template = parseHTMLTemplate(template);
        commands = template;

        if(data) {
            rebuild();
        }
    }
    var contents = null;
    function update(){
        for(var i =0;i<data.length;i++) {
            contents[i].bind(data[i]);
        }
    }
    function rebuild(){
        root.innerHTML = "";
        contents = [];
        for(var i =0;i<data.length;i++) {
            var item = document.createElement("li");
            var content = new HTMLTemplateView();
            content.setTemplate(commands);
            content.bind(data[i]);
            contents.push(content);
            item.appendChild(content);
            root.appendChild(item);
        }
    }
    return root;
}


function HTMLTemplateView(){

    var commands = null;

    var elements = [document.createDocumentFragment()];
    var controls = [];
    var control = null;
    var controlTemplate = [];
    var inControl = false;

    var attribute = null;
    var property = null;
    var internalProperty = null;
    var attributeBinding = null;
    var views = HTMLTemplateView.views


    var bindings = Object.create(null);

    var scripts = {
        "tagStart":function(tagName){            

            if(controls.length && inControl) {
                if(tagName.charAt(0)=="$") {
                    var controlName = tagName.substring(1);
                    controls.push(controlName);
                }
                attribute = null;
                property = null;
                internalProperty = null;
                attributeBinding = null;
                controlTemplate.push({command:"tagStart",param:tagName});
            }
            else if(tagName.charAt(0)=="$") {
                if(!controls.length) {
                    var controlName = tagName.substring(1);
                    control = new views[controlName]();
                    elements[elements.length-1].appendChild(control);
                    elements.push(control);
                    controlTemplate = [];
                    inControl = false;
                }
                var controlName = tagName.substring(1);
                controls.push(controlName);
            }
            else {
                attribute = null;
                property = null;
                internalProperty = null;
                attributeBinding = null;
                var element = document.createElement(tagName);
                elements[elements.length-1].appendChild(element);
                elements.push(element);
            }

            if(controls.length>1)
                inControl = true;
        },
        "tagEnd":function(tagName){

            if(controls.length  && inControl) {
                if(tagName.charAt(0)=="$") {
                    controls.pop();
                    if(controls.length == 0) {
                        control.setTemplate(controlTemplate);
                        elements.pop();
                    }
                } else {
                    attribute = null;
                    property = null;
                    internalProperty = null;
                    attributeBinding = null;
                    controlTemplate.push({command:"tagEnd",param:tagName});
                }
            }
            else {
                attribute = null;
                property = null;
                internalProperty = null;
                attributeBinding = null;
                elements.pop();
            }
        },
        "attributeName":function(name){
            if(controls.length && inControl) {
                controlTemplate.push({command:"attributeName",param:name});
                
            } else {
                if(name.charAt(0) == "@") {
                    property = name.substring(1);
                    attributeBinding = null;
                }
                else if(name.charAt(0) == "$") {
                    internalProperty = name.substring(1);
                    attributeBinding = null;
                } else {
                    attribute = document.createAttribute(name);
                    attributeBinding = null;
                    elements[elements.length-1].setAttributeNode(attribute);
                }
            }
        },
        "attributeValue":function(value){
            if(controls.length  && inControl) {
                controlTemplate.push({command:"attributeValue",param:value});
            } else {
                if(attributeBinding) {
                    attributeBinding.appendText(value);
                }
                if(attribute)
                    attribute.value = value;
                if(property) {
                    var props = property.split(".");
                    var ele = elements[elements.length-1];
                    for(var i = 0; i < props.length-1; i++)
                        ele = ele[props[i]];
                    ele[props[props.length-1]] = value;
                }
                
            }            
        },
        "text":function(text){
            if(controls.length) {
                inControl = true;
                controlTemplate.push({command:"text",param:text});
            } else {
                attribute = null;
                property = null;
                internalProperty = null;
                attributeBinding = null;
                textNode = document.createTextNode(text);
                elements[elements.length-1].appendChild(textNode);
            } 
        },
        "parameter":function(content){
            if(controls.length && inControl) {
                controlTemplate.push({command:"parameter",param:content});
            } else {
                var events = content.split("|")
                var name = events.shift();

                if(attribute && attribute.name.match(/^on/) && name.match(/command\:/)) {
                    elements[elements.length-1].addEventListener(attribute.name.substring(2),function(){
                        viewModel.dispatchEvent({type:"command",command:name.substring(8)});
                    },false)
                }
                else if(attribute||property) {
                    if(attribute && events.length) {
                        void function(attribute) {
                            events.forEach(function(event){
                                elements[elements.length-1].addEventListener(event,function(){
                                    viewModel[name] = attribute.value;
                                },false);
                            })
                        }(attribute)
                    }
                    if(property  && events.length) {
                        void function(property,element) {
                            events.forEach(function(event){
                                elements[elements.length-1].addEventListener(event,function(){
                                    viewModel[name] = element[property];
                                },false);
                            })
                        }(property,elements[elements.length-1])
                    }
                    if(!attributeBinding) {
                        if(attribute) {
                            attributeBinding = new AttributeBinding(attribute);
                            attributeBinding.appendText(attribute.value);
                        }
                        if(property) {
                            attributeBinding = new PropertyBinding(elements[elements.length-1],property);
                            attributeBinding.appendText(elements[elements.length-1][property]);
                        }
                        if(!bindings[name])
                            bindings[name] = [];
                        bindings[name].push(attributeBinding);
                    }
                    attributeBinding.appendParameter(name);
                    
                }
                else {
                    textNode = document.createTextNode("");
                    elements[elements.length-1].appendChild(textNode);
                    var binding = new TextBinding(textNode);
                    binding.appendParameter(name);
                    if(!bindings[name])
                        bindings[name] = [];
                    bindings[name].push(binding);
                }
            }
        }
    }



    elements[0].setTemplate = function(template){
        if(typeof template != "object" || Object.prototype.toString.call(template) != "[object Array]")
            template = parseHTMLTemplate(template);
        commands = template;
        for(var i = 0 ; i < commands.length ; i++ ) {
            with(commands[i])
                scripts[command](param);
        }
    }

    var viewModel = null;
    elements[0].bind = function(_viewModel){
        viewModel = _viewModel;
        Object.keys(bindings).forEach(function(k){
            bindings[k].forEach(function(b){
                b.update(viewModel);
            });            
        });
        if(viewModel.addEventListener) {
            viewModel.addEventListener("propertyChange",function(e){
                bindings[e.propertyName].forEach(function(binding){
                    binding.update(viewModel);
                });
            },false);
        }
    }

    return elements[0];
}

HTMLTemplateView.views = {
    list:HTMLTemplateListView,
    template:HTMLTemplateView
}